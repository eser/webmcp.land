import * as Sentry from "@sentry/node";

export async function register() {
  Sentry.init({
    dsn: "https://9c2eb3b4441745efad28a908001c30bf@o4510673866063872.ingest.de.sentry.io/4510673871306832",
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 1,
    sendDefaultPii: true,
  });
}
