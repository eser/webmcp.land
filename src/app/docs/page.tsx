import Link from "next/link";
import { Book, Code, Server, ArrowRight } from "lucide-react";
import { getTranslations } from "@/i18n/request";

export async function generateMetadata() {
  const t = await getTranslations("whatsWebmcp");
  return {
    title: `${t("docsTitle")} - webmcp.land`,
    description: t("docsDesc"),
  };
}

const docPages = [
  {
    href: "/docs/api",
    icon: Code,
    titleKey: "docsApiTitle" as const,
    descKey: "docsApiDesc" as const,
  },
  {
    href: "/docs/self-hosting",
    icon: Server,
    titleKey: "docsSelfHostingTitle" as const,
    descKey: "docsSelfHostingDesc" as const,
  },
  {
    href: "/whats-webmcp",
    icon: Book,
    titleKey: "docsWhatsWebmcpTitle" as const,
    descKey: "docsWhatsWebmcpDesc" as const,
  },
];

export default async function DocsPage() {
  const t = await getTranslations("whatsWebmcp");

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-2xl font-bold mb-2">{t("docsTitle")}</h1>
      <p className="text-muted-foreground mb-8">{t("docsDesc")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link
              key={page.href}
              href={page.href}
              className="group flex flex-col gap-3 rounded-lg border p-5 hover:border-foreground/20 hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div>
                <h2 className="font-semibold mb-1 group-hover:text-foreground flex items-center gap-1">
                  {t(page.titleKey)}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h2>
                <p className="text-sm text-muted-foreground">{t(page.descKey)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
