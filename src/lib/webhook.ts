import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookConfigs } from "@/lib/schema";
import type { WebhookEvent } from "@/lib/schema";
import { isPrivateUrl, WEBHOOK_PLACEHOLDERS, type ResourceData } from "./webhook-shared";

// Re-export shared constants for backward compatibility with server-side callers
export { WEBHOOK_PLACEHOLDERS, SLACK_PRESET_PAYLOAD, isPrivateUrl } from "./webhook-shared";
export type { ResourceData } from "./webhook-shared";

function escapeJsonString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

function replacePlaceholders(template: string, resource: ResourceData): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webmcp.land";
  const resourceUrl = `${siteUrl}/resources/${resource.id}`;
  const defaultAvatar = `${siteUrl}/default-avatar.png`;

  const replacements: Record<string, string> = {
    [WEBHOOK_PLACEHOLDERS.RESOURCE_ID]: resource.id,
    [WEBHOOK_PLACEHOLDERS.RESOURCE_TITLE]: escapeJsonString(resource.title),
    [WEBHOOK_PLACEHOLDERS.RESOURCE_DESCRIPTION]: escapeJsonString(resource.description || "No description"),
    [WEBHOOK_PLACEHOLDERS.RESOURCE_ENDPOINT_URL]: escapeJsonString(truncate(resource.endpointUrl, 2000)),
    [WEBHOOK_PLACEHOLDERS.RESOURCE_TYPE]: resource.serverType,
    [WEBHOOK_PLACEHOLDERS.RESOURCE_URL]: resourceUrl,
    [WEBHOOK_PLACEHOLDERS.AUTHOR_USERNAME]: resource.author.username,
    [WEBHOOK_PLACEHOLDERS.AUTHOR_NAME]: escapeJsonString(resource.author.name || resource.author.username),
    [WEBHOOK_PLACEHOLDERS.AUTHOR_AVATAR]: resource.author.avatar || defaultAvatar,
    [WEBHOOK_PLACEHOLDERS.CATEGORY_NAME]: resource.category?.name || "Uncategorized",
    [WEBHOOK_PLACEHOLDERS.TAGS]: resource.tags.map((t) => t.tag.name).join(", ") || "None",
    [WEBHOOK_PLACEHOLDERS.TIMESTAMP]: new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    [WEBHOOK_PLACEHOLDERS.SITE_URL]: siteUrl,
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return result;
}

export async function triggerWebhooks(event: WebhookEvent, resource: ResourceData): Promise<void> {
  try {
    // Get all enabled webhooks for this event
    const webhooks = await db.select().from(webhookConfigs).where(
      and(
        eq(webhookConfigs.isEnabled, true),
        sql`${event} = ANY(${webhookConfigs.events})`
      )
    );

    if (webhooks.length === 0) {
      return;
    }

    // Send webhooks in parallel (fire and forget)
    const promises = webhooks.map(async (webhook) => {
      try {
        // A10: Validate webhook URL is not targeting private/internal networks
        if (isPrivateUrl(webhook.url)) {
          console.error(`Webhook ${webhook.name} blocked: URL targets private/internal network`);
          return;
        }

        const payload = replacePlaceholders(webhook.payload, resource);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(webhook.headers as Record<string, string> || {}),
        };

        const response = await fetch(webhook.url, {
          method: webhook.method,
          headers,
          body: payload,
        });

        if (!response.ok) {
          console.error(`Webhook ${webhook.name} failed:`, response.status, await response.text());
        }
      } catch (error) {
        console.error(`Webhook ${webhook.name} error:`, error);
      }
    });

    // Don't await - fire and forget
    Promise.allSettled(promises);
  } catch (error) {
    console.error("Failed to trigger webhooks:", error);
  }
}
