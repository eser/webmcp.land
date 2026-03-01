import OpenAI from "openai";
import { and, eq, isNull, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources, resourceConnections, users, categories, resourceTags, tags, resourceVotes } from "@/lib/schema";
import { getConfig } from "@/lib/config";
import { loadPrompt, getSystemPrompt } from "./load-prompt";

const queryTranslatorPrompt = loadPrompt("src/lib/ai/query-translator.prompt.yml");

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return openai;
}

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const TRANSLATION_MODEL = process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";

/**
 * Translate a non-English search query to English keywords for better semantic search.
 * Uses a cheap model to extract and translate keywords.
 */
export async function translateQueryToEnglish(query: string): Promise<string> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(queryTranslatorPrompt)
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: queryTranslatorPrompt.modelParameters?.maxTokens || 100,
      temperature: queryTranslatorPrompt.modelParameters?.temperature || 0,
    });

    const translatedQuery = response.choices[0]?.message?.content?.trim();
    return translatedQuery || query;
  } catch (error) {
    // If translation fails, return original query
    console.error("Query translation failed:", error);
    return query;
  }
}

/**
 * Check if a string contains non-ASCII characters (likely non-English)
 */
function containsNonEnglish(text: string): boolean {
  // Check for characters outside basic ASCII range (excluding common punctuation)
  // This catches Chinese, Arabic, Japanese, Korean, Cyrillic, etc.
  return /[^\x00-\x7F]/.test(text);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

export async function generateResourceEmbedding(resourceId: string): Promise<void> {
  const config = await getConfig();
  if (!config.features.aiSearch) return;

  const [resource] = await db.select({
    title: resources.title,
    description: resources.description,
    endpointUrl: resources.endpointUrl,
    isPrivate: resources.isPrivate,
  }).from(resources).where(eq(resources.id, resourceId));

  if (!resource) return;

  // Never generate embeddings for private resources
  if (resource.isPrivate) return;

  // Combine title, description, and endpoint URL for embedding
  const textToEmbed = [
    resource.title,
    resource.description || "",
    resource.endpointUrl,
  ].join("\n\n").trim();

  const embedding = await generateEmbedding(textToEmbed);

  await db.update(resources).set({ embedding }).where(eq(resources.id, resourceId));
}

// Delay helper to avoid rate limits
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateAllEmbeddings(
  onProgress?: (current: number, total: number, success: number, failed: number) => void,
  regenerate: boolean = false
): Promise<{ success: number; failed: number; total: number }> {
  const config = await getConfig();
  if (!config.features.aiSearch) {
    throw new Error("AI Search is not enabled");
  }

  const resourceRows = await db.select({ id: resources.id }).from(resources).where(
    and(
      eq(resources.isPrivate, false),
      isNull(resources.deletedAt),
      ...(regenerate ? [] : [isNull(resources.embedding)])
    )
  );

  const total = resourceRows.length;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < resourceRows.length; i++) {
    const resource = resourceRows[i];
    try {
      await generateResourceEmbedding(resource.id);
      success++;
    } catch {
      failed++;
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, total, success, failed);
    }

    // Rate limit: wait 1000ms between requests to avoid hitting API limits
    // (GitHub Models API and other providers have stricter rate limits)
    if (i < resourceRows.length - 1) {
      await delay(1000);
    }
  }

  return { success, failed, total };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SemanticSearchResult {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  endpointUrl: string;
  status: string;
  similarity: number;
  author: {
    id: string;
    name: string | null;
    username: string;
    avatar: string | null;
    verified?: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
  }>;
  voteCount: number;
  serverType: string;
  isPrivate: boolean;
  createdAt: Date;
}

export async function semanticSearch(
  query: string,
  limit: number = 20
): Promise<SemanticSearchResult[]> {
  const config = await getConfig();
  if (!config.features.aiSearch) {
    throw new Error("AI Search is not enabled");
  }

  // Translate non-English queries to English for better semantic matching
  let searchQuery = query;
  if (containsNonEnglish(query)) {
    searchQuery = await translateQueryToEnglish(query);
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(searchQuery);

  // Fetch all public resources with embeddings (excluding soft-deleted)
  const resourceRows = await db.query.resources.findMany({
    where: and(
      eq(resources.isPrivate, false),
      isNull(resources.deletedAt),
      isNotNull(resources.embedding),
    ),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      endpointUrl: true,
      serverType: true,
      status: true,
      isPrivate: true,
      createdAt: true,
      embedding: true,
    },
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          verified: true,
        },
      },
      category: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
      votes: true,
    },
  });

  // Calculate similarity scores and filter by threshold
  const SIMILARITY_THRESHOLD = 0.4; // Filter out results below this similarity

  const scoredResources = resourceRows
    .map((resource) => {
      const embedding = resource.embedding as number[];
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...resource,
        similarity,
        voteCount: resource.votes.length,
      };
    })
    .filter((resource) => resource.similarity >= SIMILARITY_THRESHOLD);

  // Sort by similarity and return top results
  scoredResources.sort((a, b) => b.similarity - a.similarity);

  return scoredResources.slice(0, limit).map(({ votes, embedding, ...rest }) => rest);
}

export async function isAISearchEnabled(): Promise<boolean> {
  const config = await getConfig();
  return config.features.aiSearch === true && !!process.env.OPENAI_API_KEY;
}

/**
 * Find and save 4 related resources based on embedding similarity
 * Uses ResourceConnection with label "related" to store relationships
 */
export async function findAndSaveRelatedResources(resourceId: string): Promise<void> {
  const config = await getConfig();
  if (!config.features.aiSearch) return;

  const [resource] = await db.select({
    embedding: resources.embedding,
    isPrivate: resources.isPrivate,
    authorId: resources.authorId,
    serverType: resources.serverType,
  }).from(resources).where(eq(resources.id, resourceId));

  if (!resource || !resource.embedding || resource.isPrivate) return;

  const resourceEmbedding = resource.embedding as number[];

  // Fetch all public resources with embeddings (excluding this resource and soft-deleted)
  // Only match resources of the same type
  const candidates = await db.select({
    id: resources.id,
    embedding: resources.embedding,
  }).from(resources).where(
    and(
      ne(resources.id, resourceId),
      eq(resources.isPrivate, false),
      isNull(resources.deletedAt),
      isNotNull(resources.embedding),
      eq(resources.serverType, resource.serverType),
    )
  );

  // Calculate similarity scores
  const SIMILARITY_THRESHOLD = 0.5;

  const scoredResources = candidates
    .map((r) => ({
      id: r.id,
      similarity: cosineSimilarity(resourceEmbedding, r.embedding as number[]),
    }))
    .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 4);

  if (scoredResources.length === 0) return;

  // Delete existing related connections for this resource
  await db.delete(resourceConnections).where(
    and(
      eq(resourceConnections.sourceId, resourceId),
      eq(resourceConnections.label, "related"),
    )
  );

  // Create new related connections
  if (scoredResources.length > 0) {
    await db.insert(resourceConnections).values(
      scoredResources.map((r, index) => ({
        sourceId: resourceId,
        targetId: r.id,
        label: "related",
        order: index,
      }))
    ).onConflictDoNothing();
  }
}
