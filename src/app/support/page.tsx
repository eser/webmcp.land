"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBranding } from "@/components/providers/branding-provider";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ExternalLink, MessageCircleQuestion, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const GITHUB_ISSUE_BASE_URL = "https://github.com/eser/webmcp.land/issues/new";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-primary transition-colors"
      >
        {question}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "pb-4" : "max-h-0")}>
        <p className="text-muted-foreground whitespace-pre-line">{answer}</p>
      </div>
    </div>
  );
}

interface SupportFormProps {
  t: (key: string, params?: Record<string, any>) => string;
}

function SupportForm({ t }: SupportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const buildGitHubUrl = () => {
    const params = new URLSearchParams();
    params.set("support.title", title || "Support Request");
    params.set("support.body", description || "Please describe your issue or question here...");
    return `${GITHUB_ISSUE_BASE_URL}?${params.toString()}`;
  };

  return (
    <section className="border rounded-lg p-6 bg-muted/30">
      <h2 className="text-lg font-semibold mb-2">{t("support.contact.title")}</h2>
      <p className="text-muted-foreground mb-6">
        {t("support.contact.description")}
      </p>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="issue-title">{t("support.contact.form.title")}</Label>
          <Input
            id="issue-title"
            placeholder={t("support.contact.form.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue-description">{t("support.contact.form.description")}</Label>
          <Textarea
            id="issue-description"
            placeholder={t("support.contact.form.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>
      </div>

      <Button render={<a
          href={buildGitHubUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2"
         />}>
          <ExternalLink className="h-4 w-4" />
          {t("support.contact.openIssue")}
      </Button>
    </section>
  );
}

export default function SupportPage() {
  const branding = useBranding();
  const { t } = useTranslation();

  if (branding.useCloneBranding) {
    redirect("support./");
  }

  const faqItems = [
    { question: t("support.faq.whatIsPrompt.question"), answer: t("support.faq.whatIsPrompt.answer") },
    { question: t("support.faq.whyPromptsMatter.question"), answer: t("support.faq.whyPromptsMatter.answer") },
    { question: t("support.faq.whatIsWebmcpland.question"), answer: t("support.faq.whatIsWebmcpland.answer") },
    { question: t("support.faq.howToUse.question"), answer: t("support.faq.howToUse.answer") },
    { question: t("support.faq.license.question"), answer: t("support.faq.license.answer") },
    { question: t("support.faq.selfHost.question"), answer: t("support.faq.selfHost.answer") },
    { question: t("support.faq.verification.question"), answer: t("support.faq.verification.answer") },
    { question: t("support.faq.aiCredits.question"), answer: t("support.faq.aiCredits.answer") },
    { question: t("support.faq.attribution.question"), answer: t("support.faq.attribution.answer") },
  ];

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t("support.title")}</h1>
        <p className="text-muted-foreground">{t("support.description")}</p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5" />
          {t("support.faq.title")}
        </h2>

        <div className="border rounded-lg px-4">
          {faqItems.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      <SupportForm t={t} />
    </div>
  );
}
