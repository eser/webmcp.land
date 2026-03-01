import { NextResponse } from "next/server";
import { asc, ilike, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    const results = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
      })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.name, `%${query}%`),
        ),
      )
      .orderBy(asc(users.username))
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
