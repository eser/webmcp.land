"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthRedirectProps {
  callbackUri?: string;
}

export function AuthRedirect({ callbackUri }: AuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const loginUrl = callbackUri
      ? `/login?callbackUri=${encodeURIComponent(callbackUri)}`
      : "/login";
    router.replace(loginUrl);
  }, [callbackUri, router]);

  return null;
}
