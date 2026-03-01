"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const USE_CASES = [
  "booking",
  "tourism",
  "management",
  "projects",
  "health",
  "medical",
  "design",
  "accounting",
  "investing",
  "marketing",
  "ecommerce",
  "analytics",
  "devtools",
  "communication",
  "education",
  "security",
  "automation",
  "payments",
  "scheduling",
  "translation",
  "monitoring",
  "databases",
  "cloudOps",
  "publishing",
  "logistics",
  "recruitment",
  "legal",
  "realEstate",
  "entertainment",
  "fitness",
  "cooking",
  "photography",
  "music",
  "research",
  "support",
  "crm",
];

const USE_CASE_KEYWORDS: Record<string, string> = {
  booking: "booking,reservation,appointment,schedule",
  tourism: "travel,tourism,flights,hotels,trips",
  management: "management,team,workflow,organization",
  projects: "project,tasks,kanban,sprint,planning",
  health: "health,wellness,medical,patient,diagnosis",
  medical: "medical,clinical,healthcare,records,treatment",
  design: "design,ui,ux,figma,creative,visual",
  accounting: "accounting,finance,tax,budget,invoicing",
  investing: "investment,portfolio,stocks,trading,returns",
  marketing: "marketing,campaign,seo,social,brand",
  ecommerce: "ecommerce,shop,cart,products,orders",
  analytics: "analytics,data,metrics,dashboard,insights",
  devtools: "developer,code,git,ci/cd,debugging,api",
  communication: "messaging,email,slack,chat,notifications",
  education: "education,learning,courses,training,tutoring",
  security: "security,auth,ssl,encryption,compliance",
  automation: "automation,workflow,cron,triggers,webhooks",
  payments: "payments,stripe,billing,subscriptions,invoices",
  scheduling: "calendar,scheduling,events,reminders,booking",
  translation: "translation,i18n,language,localization",
  monitoring: "monitoring,alerts,uptime,logs,observability",
  databases: "database,sql,nosql,queries,migration",
  cloudOps: "cloud,aws,docker,kubernetes,deployment",
  publishing: "publishing,cms,blog,content,documents",
  logistics: "logistics,shipping,tracking,delivery,supply",
  recruitment: "hiring,recruitment,candidates,interviews,talent",
  legal: "legal,contracts,compliance,regulations,law",
  realEstate: "real estate,property,listings,mortgage,housing",
  entertainment: "media,streaming,video,audio,entertainment",
  fitness: "fitness,workout,exercise,training,wellness",
  cooking: "cooking,recipe,food,kitchen,meal planning",
  photography: "photography,images,editing,gallery,camera",
  music: "music,audio,production,playlists,streaming",
  research: "research,papers,academic,data,analysis",
  support: "support,helpdesk,tickets,customer service,chat",
  crm: "crm,contacts,leads,sales,pipeline",
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HeroCategories() {
  const { t } = useTranslation();
  const router = useRouter();
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const [changingIdx, setChangingIdx] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastChangedIdx, setLastChangedIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/registry?q=${encodeURIComponent(searchQuery.trim())}&ai=1`);
    }
  };

  const getRandomItems = useCallback(() => {
    return shuffleArray(USE_CASES).slice(0, 9);
  }, []);

  useEffect(() => {
    setVisibleItems(getRandomItems());
  }, [getRandomItems]);

  useEffect(() => {
    if (visibleItems.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random position to change (not the same as last time)
      let randomPosition = Math.floor(Math.random() * 9);
      while (randomPosition === lastChangedIdx) {
        randomPosition = Math.floor(Math.random() * 9);
      }
      setChangingIdx(randomPosition);
      setLastChangedIdx(randomPosition);

      setTimeout(() => {
        setVisibleItems(prev => {
          const newItems = [...prev];
          // Find a use case not currently visible
          const available = USE_CASES.filter(uc => !prev.includes(uc));
          if (available.length > 0) {
            newItems[randomPosition] = available[Math.floor(Math.random() * available.length)];
          } else {
            newItems[randomPosition] = USE_CASES[Math.floor(Math.random() * USE_CASES.length)];
          }
          return newItems;
        });

        // Flash the cell
        setIsFlashing(true);
        setTimeout(() => {
          setIsFlashing(false);
          setChangingIdx(null);
        }, 400);
      }, 200);
    }, 1500);

    return () => clearInterval(interval);
  }, [visibleItems.length, lastChangedIdx]);

  const handleClick = (useCase: string) => {
    const keywords = USE_CASE_KEYWORDS[useCase] || useCase;
    router.push(`/registry?q=${encodeURIComponent(keywords)}&ai=1`);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <form onSubmit={handleSearch} className="w-full max-w-lg">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder={t("heroUseCases.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-12 text-base bg-background/80 backdrop-blur-md border-2 border-primary/30 rounded-xl shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>

      <p className="text-sm text-muted-foreground">{t("heroUseCases.prefix")}</p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {visibleItems.map((useCase, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(useCase)}
            style={{
              animationDelay: `${idx * 0.15}s`,
            }}
            className={cn(
              "px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap truncate",
              "hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:-translate-y-0.5",
              "cursor-pointer transition-all duration-200",
              "border border-border/30 rounded-lg backdrop-blur-md",
              "shadow-md animate-float",
              changingIdx === idx && !isFlashing && "opacity-0 scale-95",
              changingIdx === idx && isFlashing
                ? "bg-primary/40 scale-105"
                : "bg-background/80"
            )}
          >
            {t(`heroUseCases.${useCase}`)}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{t("heroUseCases.clickToExplore")}</p>
    </div>
  );
}
