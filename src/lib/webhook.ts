import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookConfigs } from "@/lib/schema";
import type { WebhookEvent } from "@/lib/schema";

interface ResourceData {
  id: string;
  title: string;
  description: string | null;
  endpointUrl: string;
  serverType: string;
  isPrivate: boolean;
  author: {
    username: string;
    name: string | null;
    avatar: string | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  tags: { tag: { name: string; slug: string } }[];
}

// Available placeholders for webhook payloads
export const WEBHOOK_PLACEHOLDERS = {
  RESOURCE_ID: "{{RESOURCE_ID}}",
  RESOURCE_TITLE: "{{RESOURCE_TITLE}}",
  RESOURCE_DESCRIPTION: "{{RESOURCE_DESCRIPTION}}",
  RESOURCE_ENDPOINT_URL: "{{RESOURCE_ENDPOINT_URL}}",
  RESOURCE_TYPE: "{{RESOURCE_TYPE}}",
  RESOURCE_URL: "{{RESOURCE_URL}}",
  AUTHOR_USERNAME: "{{AUTHOR_USERNAME}}",
  AUTHOR_NAME: "{{AUTHOR_NAME}}",
  AUTHOR_AVATAR: "{{AUTHOR_AVATAR}}",
  CATEGORY_NAME: "{{CATEGORY_NAME}}",
  TAGS: "{{TAGS}}",
  TIMESTAMP: "{{TIMESTAMP}}",
  SITE_URL: "{{SITE_URL}}",
} as const;

// Slack Block Kit preset for new resources
export const SLACK_PRESET_PAYLOAD = `{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "{{RESOURCE_TITLE}}",
        "emoji": true
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Resource",
            "emoji": true
          },
          "url": "{{RESOURCE_URL}}",
          "style": "primary",
          "action_id": "view_resource"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "{{RESOURCE_TYPE}}",
            "emoji": true
          },
          "action_id": "type_badge"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "{{RESOURCE_DESCRIPTION}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Endpoint: \`{{RESOURCE_ENDPOINT_URL}}\`"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Author:*\\n<{{SITE_URL}}/@{{AUTHOR_USERNAME}}|@{{AUTHOR_USERNAME}}>"
        },
        {
          "type": "mrkdwn",
          "text": "*Category:*\\n{{CATEGORY_NAME}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Tags:*\\n{{TAGS}}"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "image",
          "image_url": "{{AUTHOR_AVATAR}}",
          "alt_text": "{{AUTHOR_NAME}}"
        },
        {
          "type": "mrkdwn",
          "text": "Registered by *{{AUTHOR_NAME}}* on {{TIMESTAMP}}"
        }
      ]
    },
    {
      "type": "divider"
    }
  ]
}`;

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

/**
 * A10: Validates that a URL does not point to private/internal IP ranges.
 * Blocks: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
 * Also blocks localhost and common internal hostnames.
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    // Block common internal hostnames
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
      return true;
    }

    // Check for IP addresses in private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);

    if (match) {
      const [, a, b, c] = match.map(Number);

      // 127.0.0.0/8 - Loopback
      if (a === 127) return true;

      // 10.0.0.0/8 - Private
      if (a === 10) return true;

      // 172.16.0.0/12 - Private (172.16.0.0 - 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) return true;

      // 192.168.0.0/16 - Private
      if (a === 192 && b === 168) return true;

      // 169.254.0.0/16 - Link-local
      if (a === 169 && b === 254) return true;

      // 0.0.0.0/8 - Current network
      if (a === 0) return true;

      // 224.0.0.0/4 - Multicast
      if (a >= 224 && a <= 239) return true;

      // 240.0.0.0/4 - Reserved
      if (a >= 240) return true;
    }

    // Block IPv6 loopback and link-local
    if (hostname.startsWith('[')) {
      const ipv6 = hostname.slice(1, -1).toLowerCase();
      if (ipv6 === '::1' || ipv6.startsWith('fe80:') || ipv6.startsWith('fc') || ipv6.startsWith('fd')) {
        return true;
      }
    }

    return false;
  } catch {
    // Invalid URL - treat as potentially dangerous
    return true;
  }
}

export { isPrivateUrl };

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
