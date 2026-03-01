"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, supportedLocales } from "./config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSession } from "@/lib/auth";

/**
 * Set the user's locale preference (server action)
 * Updates both cookie and database (if logged in)
 */
export async function setLocaleServer(locale: string): Promise<void> {
  if (!supportedLocales.includes(locale)) {
    throw new Error(`Locale "${locale}" is not supported`);
  }
  
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "Lax",
  });
  
  // Update database if user is logged in
  const session = await getSession();
  if (session?.user?.id) {
    await db.update(users).set({ locale }).where(eq(users.id, session.user.id));
  }
}

/**
 * Sync locale from database to cookie on login
 */
export async function syncLocaleFromUser(userId: string): Promise<void> {
  const [user] = await db.select({ locale: users.locale }).from(users).where(eq(users.id, userId));
  
  if (user?.locale) {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, user.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "Lax",
    });
  }
}
