"use client";

import { ThemeProvider } from "next-themes";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n/i18n";
import { ThemeStyles } from "./theme-styles";
import { BrandingProvider } from "./branding-provider";

interface ThemeConfig {
  radius: "none" | "sm" | "md" | "lg";
  variant: "flat" | "default" | "brutal";
  density: "compact" | "default" | "comfortable";
  colors: {
    primary: string;
  };
}

interface BrandingConfig {
  name: string;
  logo: string;
  description: string;
  useCloneBranding?: boolean;
}

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  theme: ThemeConfig;
  branding: BrandingConfig;
}

export function Providers({ children, locale, theme, branding }: ProvidersProps) {
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeStyles
          radius={theme.radius}
          variant={theme.variant}
          density={theme.density}
          primaryColor={theme.colors.primary}
        />
        <BrandingProvider branding={branding}>
          {children}
        </BrandingProvider>
        <Toaster position="bottom-right" />
      </ThemeProvider>
    </I18nextProvider>
  );
}
