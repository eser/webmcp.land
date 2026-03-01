import OpenAI from "openai";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";
import { generateEmbedding, isAISearchEnabled } from "@/lib/ai/embeddings";
import { loadPrompt, getSystemPrompt, interpolatePrompt } from "@/lib/ai/load-prompt";
import { TYPE_DEFINITIONS } from "@/data/type-definitions";

const IMPROVE_MODEL = process.env.OPENAI_IMPROVE_MODEL || "gpt-4o";

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

export type OutputType = "text" | "image" | "video" | "sound";
export type OutputFormat = "text" | "structured_json" | "structured_yaml";

export interface ImproveDescriptionInput {
  description: string;
  outputType?: OutputType;
  outputFormat?: OutputFormat;
}

export interface ImproveDescriptionResult {
  original: string;
  improved: string;
  outputType: OutputType;
  outputFormat: OutputFormat;
  inspirations: Array<{ id: string; slug: string | null; title: string; similarity: number }>;
  model: string;
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

async function findSimilarResources(
  query: string,
  limit: number = 3
): Promise<Array<{ id: string; slug: string | null; title: string; description: string | null; similarity: number }>> {
  const aiSearchEnabled = await isAISearchEnabled();
  if (!aiSearchEnabled) {
    console.log("[improve-description] AI search is not enabled");
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(query);

    const resourceRows = await db.select({
      id: resources.id,
      slug: resources.slug,
      title: resources.title,
      description: resources.description,
      embedding: resources.embedding,
    }).from(resources).where(
      and(
        eq(resources.isPrivate, false),
        isNull(resources.deletedAt),
        isNotNull(resources.embedding),
      )
    ).limit(100);

    console.log(`[improve-description] Found ${resourceRows.length} resources with embeddings`);

    const SIMILARITY_THRESHOLD = 0.3;

    const scoredResources = resourceRows
      .map((r) => {
        const embedding = r.embedding as number[];
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          description: r.description,
          similarity,
        };
      })
      .filter((resource) => resource.similarity >= SIMILARITY_THRESHOLD);

    scoredResources.sort((a, b) => b.similarity - a.similarity);

    return scoredResources.slice(0, limit);
  } catch (error) {
    console.error("[improve-description] Error finding similar resources:", error);
    return [];
  }
}

function formatSimilarResources(
  resources: Array<{ title: string; description: string | null; similarity: number }>
): string {
  if (resources.length === 0) {
    return "No similar resources found for inspiration.";
  }

  return resources
    .map(
      (r, i) =>
        `### Inspiration ${i + 1}: ${r.title}\n${(r.description || "").slice(0, 500)}${(r.description || "").length > 500 ? "..." : ""}`
    )
    .join("\n\n");
}

export async function improveDescription(input: ImproveDescriptionInput): Promise<ImproveDescriptionResult> {
  const { description, outputType = "text", outputFormat = "text" } = input;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("AI features are not configured");
  }

  // Find similar resources for inspiration
  const similarResources = await findSimilarResources(description);
  const similarResourcesText = formatSimilarResources(similarResources);

  // Load and interpolate the prompt template
  const improvePromptFile = loadPrompt("src/lib/ai/improve-prompt.prompt.yml");

  const systemPrompt = interpolatePrompt(getSystemPrompt(improvePromptFile), {
    similarPrompts: similarResourcesText,
    typeDefinitions: TYPE_DEFINITIONS,
  });

  const userMessage = improvePromptFile.messages.find((m) => m.role === "user");
  const userPrompt = interpolatePrompt(userMessage?.content || "", {
    outputFormat,
    outputType,
    originalPrompt: description,
  });

  // Call OpenAI
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: IMPROVE_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: improvePromptFile.modelParameters?.temperature ?? 0.7,
    max_tokens: improvePromptFile.modelParameters?.maxTokens ?? 4000,
  });

  const improvedDescription = response.choices[0]?.message?.content?.trim() || "";

  if (!improvedDescription) {
    throw new Error("Failed to generate improved description");
  }

  return {
    original: description,
    improved: improvedDescription,
    outputType,
    outputFormat,
    inspirations: similarResources.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      similarity: Math.round(r.similarity * 100),
    })),
    model: IMPROVE_MODEL,
  };
}
