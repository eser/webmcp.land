import { AuthRedirect } from "@/components/auth/auth-redirect";
import { getLocale, getTranslations } from "@/i18n/request";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import config from "@/../webmcp.config";
import { ProfileForm } from "@/components/settings/profile-form";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import type { CustomLink } from "@/components/user/profile-links";

export default async function SettingsPage() {
  const session = await getSession();
  const t = await getTranslations("settings");

  if (!session?.user) {
    return <AuthRedirect callbackUri="/settings" />;
  }

  const [user] = await db.select({
    id: users.id,
    name: users.name,
    username: users.username,
    email: users.email,
    avatar: users.avatar,
    verified: users.verified,
    apiKey: users.apiKey,
    resourcesPublicByDefault: users.resourcesPublicByDefault,
    bio: users.bio,
    customLinks: users.customLinks,
  }).from(users).where(eq(users.id, session.user.id));

  if (!user) {
    return <AuthRedirect callbackUri="/settings" />;
  }

  return (
    <div className="container max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="space-y-6">
        <ProfileForm 
          user={{
            ...user,
            customLinks: user.customLinks as CustomLink[] | null,
          }} 
          showVerifiedSection={!config.homepage?.useCloneBranding} 
        />

        {config.features.mcp !== false && (
          <ApiKeySettings
            initialApiKey={user.apiKey}
            initialPublicByDefault={user.resourcesPublicByDefault}
          />
        )}
      </div>
    </div>
  );
}
