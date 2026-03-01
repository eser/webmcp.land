"use client";

import * as Sentry from "@sentry/browser";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again later.</p>
      </body>
    </html>
  );
}
