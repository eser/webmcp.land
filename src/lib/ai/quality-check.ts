import OpenAI from "openai";
import { loadPrompt, getSystemPrompt } from "./load-prompt";

const qualityCheckPrompt = loadPrompt("src/lib/ai/quality-check.prompt.yml");

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

const GENERATIVE_MODEL = process.env.OPENAI_GENERATIVE_MODEL || "gpt-4o";

// Minimum character count for resource description
const MIN_DESCRIPTION_LENGTH = 50;

// Minimum word count for resource description
const MIN_WORD_COUNT = 10;

export interface QualityCheckResult {
  shouldSuspend: boolean;
  reason: string | null;
  confidence: number;
  details: string;
}

/**
 * Performs basic length checks on resource description
 */
function checkLength(description: string): QualityCheckResult | null {
  const trimmed = description.trim();
  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    return {
      shouldSuspend: true,
      reason: "TOO_SHORT",
      confidence: 1.0,
      details: `Description is too short (${trimmed.length} chars, minimum ${MIN_DESCRIPTION_LENGTH})`,
    };
  }

  if (wordCount < MIN_WORD_COUNT) {
    return {
      shouldSuspend: true,
      reason: "TOO_SHORT",
      confidence: 1.0,
      details: `Description has too few words (${wordCount} words, minimum ${MIN_WORD_COUNT})`,
    };
  }

  return null;
}

/**
 * AI-powered quality check for resource content
 * Returns quality assessment with high precision to avoid false positives
 */
export async function checkResourceQuality(
  title: string,
  description: string,
  endpointUrl?: string | null
): Promise<QualityCheckResult> {
  console.log(`[Quality Check] Checking: "${title}" (${description.length} chars)`);

  // First, run basic length checks (no AI needed)
  const lengthCheck = checkLength(description);
  if (lengthCheck) {
    console.log(`[Quality Check] Length check failed:`, lengthCheck);
    return lengthCheck;
  }

  // Check if OpenAI is available
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(`[Quality Check] No OpenAI API key - skipping AI check`);
    // If no AI available, pass the check (avoid false positives)
    return {
      shouldSuspend: false,
      reason: null,
      confidence: 0,
      details: "AI quality check skipped - no API key configured",
    };
  }

  console.log(`[Quality Check] Running AI check...`);

  try {
    const client = getOpenAIClient();

    const systemPrompt = getSystemPrompt(qualityCheckPrompt);

    const userMessage = `Title: ${title}
${description ? `Description: ${description}\n` : ""}
${endpointUrl ? `Endpoint URL: ${endpointUrl}\n` : ""}`;

    const response = await client.chat.completions.create({
      model: GENERATIVE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const responseText = response.choices[0]?.message?.content || "{}";
    console.log(`[Quality Check] AI response:`, responseText);

    try {
      const result = JSON.parse(responseText);

      // Extra safety: only suspend if confidence is high enough
      if (result.shouldDelist && result.confidence < 0.85) {
        return {
          shouldSuspend: false,
          reason: null,
          confidence: result.confidence,
          details: `Below confidence threshold: ${result.details}`,
        };
      }

      return {
        shouldSuspend: !!result.shouldDelist,
        reason: result.reason as string | null,
        confidence: result.confidence || 0,
        details: result.details || "Quality check completed",
      };
    } catch {
      console.error("Failed to parse AI quality check response:", responseText);
      // On parse error, don't suspend (avoid false positives)
      return {
        shouldSuspend: false,
        reason: null,
        confidence: 0,
        details: "Failed to parse AI response - defaulting to approve",
      };
    }
  } catch (error) {
    console.error("AI quality check error:", error);
    // On error, don't suspend (avoid false positives)
    return {
      shouldSuspend: false,
      reason: null,
      confidence: 0,
      details: "AI quality check failed - defaulting to approve",
    };
  }
}

/**
 * Check if auto-suspend feature is enabled
 */
export async function isAutoSuspendEnabled(): Promise<boolean> {
  // Auto-suspend requires OpenAI API key for AI checks
  // Basic length checks will still work without it
  return true;
}
