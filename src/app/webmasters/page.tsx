import { getTranslations } from "@/i18n/request";
import { WebmastersContent } from "@/components/webmasters/webmasters-content";

export default async function WebmastersPage() {
  const t = await getTranslations("webmasters");

  const translations = {
    title: t("title"),
    description: t("description"),
    allTime: t("allTime"),
    thisMonth: t("thisMonth"),
    thisWeek: t("thisWeek"),
    noData: t("noData"),
    resources: t("resources"),
    upvotes: t("upvotes"),
    perResource: t("perResource"),
    sortByTotal: t("sortByTotal"),
    sortByRatio: t("sortByRatio"),
  };

  return <WebmastersContent translations={translations} />;
}
