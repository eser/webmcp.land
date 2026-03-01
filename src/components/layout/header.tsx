"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth/client";
import { useTranslation } from "react-i18next";
import {
  Menu,
  Plus,
  User,
  Settings,
  LogOut,
  Shield,
  Globe,
  Moon,
  Sun,
  Copy,
  ExternalLink,
  Chromium,
  MoreHorizontal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { setLocale } from "@/lib/i18n/client";
import { useBranding } from "@/components/providers/branding-provider";
import { analyticsAuth, analyticsSettings, analyticsExternal } from "@/lib/analytics";
import { isChromeBrowser, isFirefoxBrowser } from "@/lib/utils";

const FIREFOX_ADDON_URL = "https://addons.mozilla.org/firefox/downloads/file/4675190/webmcp_land-1.4.1.xpi";

const languages = [
  { code: "en", name: "English" },
  { code: "zh", name: "中文" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "nl", name: "Dutch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "tr", name: "Türkçe" },
  { code: "az", name: "Azərbaycan dili" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "fa", name: "فارسی" },
  { code: "ru", name: "Русский" },
  { code: "he", name: "עברית" },
  { code: "el", name: "Ελληνικά" }
];

interface HeaderProps {
  authProvider?: string;
  allowRegistration?: boolean;
}

export function Header({ authProvider = "credentials", allowRegistration = true }: HeaderProps) {
  const isOAuth = authProvider !== "credentials";
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const branding = useBranding();
  const router = useRouter();
  const pathname = usePathname();

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [browserType, setBrowserType] = useState<"chrome" | "firefox" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isFirefoxBrowser()) {
      setBrowserType("firefox");
    } else if (isChromeBrowser()) {
      setBrowserType("chrome");
    }
  }, []);

  const handleCopyLogoSvg = async () => {
    try {
      const logoUrl = theme === "dark" ? (branding.logoDark || branding.logo) : branding.logo;
      if (!logoUrl) return;
      const response = await fetch(logoUrl);
      const svgContent = await response.text();
      await navigator.clipboard.writeText(svgContent);
    } catch (error) {
      console.error("Failed to copy logo:", error);
    }
  };

  return (
    <header className="sticky top-[0px] z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center gap-4 container">
        {/* Mobile menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 md:hidden" />}>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 border-b">
                {branding.logo && (
                  <>
                    <Image
                      src={branding.logo}
                      alt={branding.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 dark:hidden"
                    />
                    <Image
                      src={branding.logoDark || branding.logo}
                      alt={branding.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 hidden dark:block"
                    />
                  </>
                )}
                <span className="text-lg font-semibold mt-2">{branding.name}</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {mounted && user && (
                    <>
                      <Link
                        href="/collection"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {t("nav.collection")}
                      </Link>
                      <Link
                        href="/feed"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {t("nav.feed")}
                      </Link>
                    </>
                  )}
                  <Link
                    href="/registry"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {t("nav.registry")}
                  </Link>
                  <Link
                    href="/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {t("nav.categories")}
                  </Link>
                  <Link
                    href="/tags"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {t("nav.tags")}
                  </Link>
                  <Link
                    href="/discover"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {t("feed.discover")}
                  </Link>
                  <Link
                    href="/webmasters"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {t("nav.webmasters")}
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  {branding.name}
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        {!branding.useCloneBranding ? (
          <ContextMenu>
            <ContextMenuTrigger render={<Link href="/" className="flex gap-2" />}>
                {branding.logo && (
                  <>
                    <Image
                      src={branding.logo}
                      alt={branding.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 dark:hidden"
                    />
                    <Image
                      src={branding.logoDark || branding.logo}
                      alt={branding.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 hidden dark:block"
                    />
                  </>
                )}
                <span className="font-semibold leading-none mt-[2px]">{branding.name}</span>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={handleCopyLogoSvg}>
                <Copy className="mr-2 h-4 w-4" />
                {t("brand.copyLogoSvg")}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => router.push("/brand")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("brand.brandAssets")}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          <Link href="/" className="flex gap-2">
            {branding.logo && (
              <>
                <Image
                  src={branding.logo}
                  alt={branding.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 dark:hidden"
                />
                <Image
                  src={branding.logoDark || branding.logo}
                  alt={branding.name}
                  width={20}
                  height={20}
                  className="h-5 w-5 hidden dark:block"
                />
              </>
            )}
            <span className="font-semibold leading-none mt-[2px]">{branding.name}</span>
          </Link>
        )}

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {mounted && user && (
            <>
              <Link
                href="/collection"
                className="px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                {t("nav.collection")}
              </Link>
              <Link
                href="/feed"
                className="px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                {t("nav.feed")}
              </Link>
            </>
          )}
          <Link
            href="/registry"
            className="px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          >
            {t("nav.registry")}
          </Link>
          {/* Categories, Tags, Webmasters - visible on lg+ screens */}
          <Link
            href="/categories"
            className="hidden 2xl:block px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          >
            {t("nav.categories")}
          </Link>
          <Link
            href="/tags"
            className="hidden 2xl:block px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          >
            {t("nav.tags")}
          </Link>
          <Link
            href="/webmasters"
            className="hidden 2xl:block px-3 py-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
          >
            {t("nav.webmasters")}
          </Link>
          {/* Three-dot dropdown for Categories, Tags, Webmasters on md screens */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="2xl:hidden h-8 w-8" />}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t("nav.more")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem render={<Link href="/categories" />}>
                  {t("nav.categories")}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/tags" />}>
                  {t("nav.tags")}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/webmasters" />}>
                  {t("nav.webmasters")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Create resource button */}
          {mounted && user && (
            <Button render={<Link href="/registry/new" />} variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
                <span className="sr-only">{t("resources.create")}</span>
            </Button>
          )}

          {/* Notifications */}
          {mounted && user && <NotificationBell />}

          {mounted && browserType && branding.chromeExtensionUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              render={
                <a
                  href={browserType === "firefox" ? FIREFOX_ADDON_URL : branding.chromeExtensionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analyticsExternal.clickChromeExtension()}
                />
              }
            >
                {browserType === "firefox" ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF7139">
                    <path d="M20.452 3.445a11.002 11.002 0 00-2.482-1.908C16.944.997 15.098.093 12.477.032c-.734-.017-1.457.03-2.174.144-.72.114-1.398.292-2.118.56-1.017.377-1.996.975-2.574 1.554.583-.349 1.476-.733 2.55-.992a10.083 10.083 0 013.729-.167c2.341.34 4.178 1.381 5.48 2.625a8.066 8.066 0 011.298 1.587c1.468 2.382 1.33 5.376.184 7.142-.85 1.312-2.67 2.544-4.37 2.53-.583-.023-1.438-.152-2.25-.566-2.629-1.343-3.021-4.688-1.118-6.306-.632-.136-1.82.13-2.646 1.363-.742 1.107-.7 2.816-.242 4.028a6.473 6.473 0 01-.59-1.895 7.695 7.695 0 01.416-3.845A8.212 8.212 0 019.45 5.399c.896-1.069 1.908-1.72 2.75-2.005-.54-.471-1.411-.738-2.421-.767C8.31 2.583 6.327 3.061 4.7 4.41a8.148 8.148 0 00-1.976 2.414c-.455.836-.691 1.659-.697 1.678.122-1.445.704-2.994 1.248-4.055-.79.413-1.827 1.668-2.41 3.042C.095 9.37-.2 11.608.14 13.989c.966 5.668 5.9 9.982 11.843 9.982C18.62 23.971 24 18.591 24 11.956a11.93 11.93 0 00-3.548-8.511z"/>
                  </svg>
                ) : (
                  <Chromium className="h-4 w-4" />
                )}
                <span className="sr-only">Get Browser Extension</span>
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark";
              analyticsSettings.changeTheme(newTheme);
              setTheme(newTheme);
            }}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu or login */}
          {mounted && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 gap-2 px-2" />}>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    @{user.username}
                  </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={`/@${user.username}`} />}>
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    {t("settings.language")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {languages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => {
                          analyticsSettings.changeLanguage(lang.code);
                          setLocale(lang.code);
                        }}
                      >
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  analyticsAuth.logout();
                  await signOut();
                  window.location.href = "/";
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1">
              {/* Language selector for non-logged in users */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                    <Globe className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => {
                        analyticsSettings.changeLanguage(lang.code);
                        setLocale(lang.code);
                      }}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button render={<Link href="/login" />} variant="ghost" size="sm" className="h-8 text-xs">
                {t("nav.login")}
              </Button>
              {authProvider === "credentials" && allowRegistration && (
                <Button render={<Link href="/register" />} size="sm" className="h-8 text-xs">
                    {t("nav.register")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
