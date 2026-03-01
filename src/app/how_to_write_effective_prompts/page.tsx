import { getTranslations } from "@/i18n/request";
import { ResourceWritingGuideContent } from "@/components/resources/resource-writing-guide-content";
import { LanguageSwitcher } from "@/components/resources/language-switcher";

export async function generateMetadata() {
  const t = await getTranslations("resourceWritingGuide");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function HowToWriteEffectivePromptsPage() {
  const t = await getTranslations("resourceWritingGuide");

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-4">{t("subtitle")}</p>
        <LanguageSwitcher />
      </div>
      <ResourceWritingGuideContent />
    </div>
  );
}
