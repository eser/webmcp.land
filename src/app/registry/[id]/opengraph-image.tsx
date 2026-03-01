import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resources } from "@/lib/schema";
import { getConfig } from "@/lib/config";

export const alt = "Resource Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const typeLabels: Record<string, string> = {
  MCP: "MCP Server",
  WEBMCP: "WebMCP Server",
};

const typeColors: Record<string, string> = {
  MCP: "#3b82f6",
  WEBMCP: "#8b5cf6",
};

const radiusMap: Record<string, number> = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
};

/**
 * Extracts the resource ID from a URL parameter that may contain a slug
 */
function extractResourceId(idParam: string): string {
  const underscoreIndex = idParam.indexOf("_");
  if (underscoreIndex !== -1) {
    return idParam.substring(0, underscoreIndex);
  }
  return idParam;
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = extractResourceId(idParam);
  const config = await getConfig();
  const radius = radiusMap[config.theme?.radius || "sm"] || 8;
  const radiusLg = radius * 2; // For larger elements like content box

  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      author: {
        columns: {
          name: true,
          username: true,
          avatar: true,
        },
      },
      category: {
        columns: {
          name: true,
          icon: true,
        },
      },
      votes: true,
    },
  });

  if (!resource) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            color: "#fff",
            fontSize: 48,
            fontWeight: 600,
          }}
        >
          Resource Not Found
        </div>
      ),
      { ...size }
    );
  }

  // Display the endpoint URL and description
  const displayContent = resource.description || resource.endpointUrl || "No description";
  const truncatedContent = displayContent.length > 400
    ? displayContent.slice(0, 400) + "..."
    : displayContent;

  const voteCount = resource.votes.length;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: "48px 56px",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          {/* Left: Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: config.theme?.colors?.primary || "#6366f1" }}>
              {config.branding.name}
            </span>
          </div>

          {/* Right: Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* Upvotes */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={config.theme?.colors?.primary || "#6366f1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span style={{ fontSize: 24, fontWeight: 600, color: config.theme?.colors?.primary || "#6366f1" }}>
                {voteCount}
              </span>
            </div>

          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 40,
          }}
        >
          {/* Left Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Title Row with Category and Type Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 20,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#18181b",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  flex: 1,
                }}
              >
                {resource.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {/* Category Badge */}
                {resource.category && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#f4f4f5",
                      color: "#71717a",
                      padding: "8px 14px",
                      borderRadius: radius * 2.5,
                      fontSize: 20,
                      fontWeight: 500,
                    }}
                  >
                    {resource.category.icon && <span>{resource.category.icon}</span>}
                    <span>{resource.category.name}</span>
                  </div>
                )}
                {/* Type Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: (typeColors[resource.serverType] || "#3b82f6") + "30",
                    color: typeColors[resource.serverType] || "#3b82f6",
                    padding: "8px 16px",
                    borderRadius: radius * 2.5,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {typeLabels[resource.serverType] || resource.serverType}
                </div>
              </div>
            </div>

            {/* Content Preview */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 22,
                color: "#3f3f46",
                lineHeight: 1.6,
                flex: 1,
                backgroundColor: "#fafafa",
                padding: "12px 14px",
                borderRadius: radius,
                border: `2px solid ${config.theme?.colors?.primary || "#6366f1"}20`,
                overflow: "hidden",
              }}
            >
              {resource.endpointUrl && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottom: "1px solid #e4e4e7",
                  }}
                >
                  <span style={{ color: config.theme?.colors?.primary || "#6366f1", fontWeight: 600, fontSize: 14, fontFamily: "monospace" }}>
                    {resource.endpointUrl}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", whiteSpace: "pre-wrap" }}>
                {truncatedContent}
              </div>
            </div>

            {/* Footer - Author Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Avatar */}
                {resource.author.avatar ? (
                  <img
                    src={resource.author.avatar}
                    width={48}
                    height={48}
                    style={{ borderRadius: 24, border: "2px solid #e4e4e7" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#f4f4f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#71717a",
                      fontSize: 20,
                      fontWeight: 600,
                      border: "2px solid #e4e4e7",
                    }}
                  >
                    {(resource.author.name || resource.author.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "#18181b", fontSize: 20, fontWeight: 600 }}>
                    {resource.author.name || resource.author.username}
                  </span>
                  <span style={{ color: "#71717a", fontSize: 16 }}>
                    @{resource.author.username}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    ),
    { ...size }
  );
}
