import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getConfig } from "@/lib/config";

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(1).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    // Check if registration is allowed
    const config = await getConfig();
    if (!config.auth.allowRegistration) {
      return NextResponse.json(
        { error: "registration_disabled", message: "Registration is disabled" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", message: "Invalid input" },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;

    // Check if email already exists
    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existingEmail) {
      return NextResponse.json(
        { error: "email_taken", message: "Email is already taken" },
        { status: 400 }
      );
    }

    // Check if username already exists (case-insensitive)
    const [existingUsername] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = ${username.toLowerCase()}`);

    if (existingUsername) {
      return NextResponse.json(
        { error: "username_taken", message: "Username is already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        name,
        username,
        email,
        password: hashedPassword,
      })
      .returning();

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
