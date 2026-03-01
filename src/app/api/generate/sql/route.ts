import { NextRequest, NextResponse } from "next/server";
import { generateSQL, isDiscoveryEnabled } from "@/lib/ai/generation";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // A01: Require authentication before generating SQL
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const enabled = await isDiscoveryEnabled();
    if (!enabled) {
      return NextResponse.json(
        { error: "AI features are not enabled" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const sql = await generateSQL(prompt);

    return NextResponse.json({ sql });
  } catch (error) {
    console.error("SQL Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate SQL" },
      { status: 500 }
    );
  }
}
