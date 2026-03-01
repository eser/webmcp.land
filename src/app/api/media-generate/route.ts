import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import {
  getMediaGeneratorPlugin,
  getAvailableModels,
  isMediaGenerationAvailable,
} from "@/lib/plugins/media-generators";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const available = isMediaGenerationAvailable();
  const imageModels = getAvailableModels("image");
  const videoModels = getAvailableModels("video");
  const audioModels = getAvailableModels("audio");

  // Get user's flagged status
  const [user] = await db
    .select({
      flagged: users.flagged,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    available,
    imageModels,
    videoModels,
    audioModels,
    canGenerate: !user?.flagged,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check user's flagged status
    const [user] = await db
      .select({
        flagged: users.flagged,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Block flagged users
    if (user.flagged) {
      return NextResponse.json(
        { error: "Your account has been flagged. Media generation is disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prompt, model, provider, type, inputImageUrl, resolution, aspectRatio } = body;

    if (!prompt || !model || !provider || !type) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, model, provider, type" },
        { status: 400 }
      );
    }

    const plugin = getMediaGeneratorPlugin(provider);

    if (!plugin) {
      return NextResponse.json(
        { error: `Provider "${provider}" not found` },
        { status: 404 }
      );
    }

    if (!plugin.isEnabled()) {
      return NextResponse.json(
        { error: `Provider "${provider}" is not enabled` },
        { status: 400 }
      );
    }

    const task = await plugin.startGeneration({
      prompt,
      model,
      type,
      inputImageUrl,
      resolution,
      aspectRatio,
    });

    return NextResponse.json({
      success: true,
      taskId: task.taskId,
      socketAccessToken: task.socketAccessToken,
      webSocketUrl: plugin.getWebSocketUrl(),
      provider,
    });
  } catch (error) {
    console.error("Media generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
