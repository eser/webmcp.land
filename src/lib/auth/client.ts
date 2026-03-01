"use client";

import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins";
import type { auth } from "./index";

export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient()],
});

// Convenience exports for components
export const { useSession, signIn, signOut } = authClient;
