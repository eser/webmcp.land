import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, categorySubscriptions } from "@/lib/schema";

// POST - Subscribe to a category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;

    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      return NextResponse.json(
        { error: "not_found", message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if already subscribed
    const [existing] = await db
      .select()
      .from(categorySubscriptions)
      .where(
        and(
          eq(categorySubscriptions.userId, session.user.id),
          eq(categorySubscriptions.categoryId, categoryId),
        )
      );

    if (existing) {
      return NextResponse.json(
        { error: "already_subscribed", message: "Already subscribed to this category" },
        { status: 400 }
      );
    }

    // Create subscription
    await db
      .insert(categorySubscriptions)
      .values({
        userId: session.user.id,
        categoryId,
      });

    // Return the category info
    return NextResponse.json({
      subscribed: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;

    // Delete subscription
    await db
      .delete(categorySubscriptions)
      .where(
        and(
          eq(categorySubscriptions.userId, session.user.id),
          eq(categorySubscriptions.categoryId, categoryId),
        )
      );

    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong" },
      { status: 500 }
    );
  }
}
