import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { generateApiKey } from "@/lib/api-key";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      apiKey: users.apiKey,
      resourcesPublicByDefault: users.resourcesPublicByDefault,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    hasApiKey: !!user.apiKey,
    apiKey: user.apiKey,
    resourcesPublicByDefault: user.resourcesPublicByDefault,
  });
}

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = generateApiKey();

  await db
    .update(users)
    .set({ apiKey })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ apiKey });
}

export async function DELETE() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ apiKey: null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { resourcesPublicByDefault } = body;

  if (typeof resourcesPublicByDefault !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ resourcesPublicByDefault })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
