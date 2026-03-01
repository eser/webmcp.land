import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const customLinkSchema = z.object({
  type: z.enum(["website", "github", "twitter", "linkedin", "instagram", "youtube", "twitch", "discord", "mastodon", "bluesky", "sponsor"]),
  url: z.string().url(),
  label: z.string().max(30).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  username: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  avatar: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(250).optional().or(z.literal("")),
  customLinks: z.array(customLinkSchema).max(5).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, username, avatar, bio, customLinks } = parsed.data;

    // Check if username is taken by another user
    if (username !== session.user.username) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username));

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "username_taken", message: "This username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user
    const [user] = await db
      .update(users)
      .set({
        name,
        username,
        avatar: avatar || null,
        bio: bio || null,
        customLinks: customLinks && customLinks.length > 0 ? customLinks : null,
      })
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        bio: users.bio,
        customLinks: users.customLinks,
      });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user) {
      return NextResponse.json(
        { error: "not_found", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
