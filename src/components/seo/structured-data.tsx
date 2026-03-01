import { getConfig } from "@/lib/config";

interface StructuredDataProps {
  type: "website" | "organization" | "breadcrumb" | "resource" | "softwareApp" | "itemList";
  data?: {
    breadcrumbs?: Array<{ name: string; url: string }>;
    resource?: {
      id: string;
      name: string;
      description: string;
      content: string;
      author?: string;
      authorUrl?: string;
      datePublished?: string;
      dateModified?: string;
      category?: string;
      tags?: string[];
      voteCount?: number;
    };
    items?: Array<{
      name: string;
      url: string;
      description?: string;
      image?: string;
    }>;
  };
}

export async function StructuredData({ type, data }: StructuredDataProps) {
  const config = await getConfig();
  const baseUrl = process.env.BETTER_AUTH_URL || "https://webmcp.land";

  const schemas: Record<string, object | null> = {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: config.branding.name,
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}${config.branding.logo}`,
        width: 512,
        height: 512,
      },
      description: config.branding.description,
      sameAs: [
        "https://github.com/eser/webmcp.land",
        "https://x.com/webmcp_land",
      ],
    },
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.branding.name,
      url: baseUrl,
      description: config.branding.description,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/registry?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        "@type": "Organization",
        name: config.branding.name,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}${config.branding.logo}`,
        },
      },
    },
    breadcrumb:
      data?.breadcrumbs && data.breadcrumbs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: data.breadcrumbs.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
            })),
          }
        : null,
    resource: data?.resource
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${baseUrl}/registry/${data.resource.id}`,
          name: data.resource.name,
          description: data.resource.description || `MCP/WebMCP service: ${data.resource.name}`,
          applicationCategory: "DeveloperApplication",
          author: data.resource.author
            ? {
                "@type": "Person",
                name: data.resource.author,
                url: data.resource.authorUrl,
              }
            : undefined,
          datePublished: data.resource.datePublished,
          dateModified: data.resource.dateModified,
          publisher: {
            "@type": "Organization",
            name: config.branding.name,
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}${config.branding.logo}`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${baseUrl}/registry/${data.resource.id}`,
          },
          aggregateRating: data.resource.voteCount && data.resource.voteCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: 5,
                bestRating: 5,
                ratingCount: data.resource.voteCount,
              }
            : undefined,
          keywords: data.resource.tags?.join(", ") || data.resource.category,
        }
      : null,
    softwareApp: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: config.branding.name,
      description: config.branding.description,
      url: baseUrl,
      applicationCategory: "UtilitiesApplication",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      softwareVersion: "1.0",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "MCP/WebMCP service registry",
        "Service sharing and discovery",
        "Community contributions",
        "Version history",
        "Categories and tags",
      ],
      screenshot: `${baseUrl}/og.png`,
    },
    itemList: data?.items
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: data.items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareApplication",
              name: item.name,
              description: item.description,
              url: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
            },
          })),
        }
      : null,
  };

  const schema = schemas[type];
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export async function WebsiteStructuredData() {
  return (
    <>
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="softwareApp" />
    </>
  );
}
