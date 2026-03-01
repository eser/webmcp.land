import { betterAuth } from "better-auth";
import { username, admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { getConfig } from "@/lib/config";
import { headers } from "next/headers";

// Generate a unique username from email or name
async function generateUsername(email: string, name?: string | null): Promise<string> {
  let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

  if (baseUsername.length < 3 && name) {
    baseUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15);
  }

  if (baseUsername.length < 3) {
    baseUsername = "user";
  }

  let username = baseUsername;
  let counter = 1;
  while (true) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    if (!existing) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

// Build social providers from config
async function buildSocialProviders() {
  const config = await getConfig();
  const providerIds = config.auth.providers ?? (config.auth.provider ? [config.auth.provider] : []);

  const socialProviders: Record<string, any> = {};

  for (const id of providerIds) {
    switch (id) {
      case "github":
        if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
          socialProviders.github = {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          };
        }
        break;
      case "google":
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
          socialProviders.google = {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          };
        }
        break;
      case "apple":
        if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
          socialProviders.apple = {
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
          };
        }
        break;
      case "azure":
        if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
          socialProviders.microsoft = {
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
          };
        }
        break;
    }
  }

  return socialProviders;
}

const socialProviders = await buildSocialProviders();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verificationTokens,
    },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => hashPassword(password),
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
  socialProviders,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
        input: false,
      },
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
      bio: {
        type: "string",
        required: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
      password: {
        type: "string",
        required: false,
        input: false,
      },
      verified: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      githubUsername: {
        type: "string",
        required: false,
      },
      apiKey: {
        type: "string",
        required: false,
      },
      resourcesPublicByDefault: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      flagged: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      flaggedAt: {
        type: "date",
        required: false,
      },
      flaggedReason: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    username(),
    admin(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Generate username if not provided
          if (!user.username) {
            const generatedUsername = await generateUsername(user.email, user.name);
            return { data: { ...user, username: generatedUsername } };
          }

          // Handle unclaimed account claiming
          const unclaimedEmail = `${user.username}@unclaimed.webmcp.land`;
          const [unclaimedUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, unclaimedEmail));

          if (unclaimedUser) {
            // Claim this account - update with real user info
            await db
              .update(users)
              .set({
                name: user.name,
                email: user.email,
                avatar: user.image ?? undefined,
                emailVerified: user.emailVerified ? new Date() : undefined,
              })
              .where(eq(users.id, unclaimedUser.id));

            // Return false to prevent duplicate creation
            return { data: false as any };
          }

          // Ensure username is unique
          const baseUsername = (user.username as string).toLowerCase();
          let finalUsername = baseUsername;
          let counter = 1;
          while (true) {
            const [existing] = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.username, finalUsername));
            if (!existing) break;
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }

          return { data: { ...user, username: finalUsername } };
        },
      },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});

// Server-side session helper (replaces next-auth's auth())
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

// Export type for client usage
export type Session = typeof auth.$Infer.Session;
