"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { GitHubStarCount } from "@/components/ui/github-star-count";
import { useTranslation } from "@/lib/hooks/useTranslation";

export function HeaderLogo() {
  const pathname = usePathname();
  const { t } = useTranslation("common");

  const isLandingPage = pathname === "/";

  const title = useMemo(() => {
    const pageConfig: Record<string, { key: string; fallback: string }> = {
      "/markets/bitcoin": {
        key: "page_titles.bitcoin",
        fallback: "Bitcoin on Aptos",
      },
      "/markets/stables": {
        key: "page_titles.stablecoins",
        fallback: "Stablecoins",
      },
      "/stablecoins": {
        key: "page_titles.stablecoins",
        fallback: "Stablecoins",
      },
      "/protocols/lst": { key: "page_titles.lst", fallback: "Liquid Staking" },
      "/protocols/defi": {
        key: "page_titles.defi",
        fallback: "DeFi Intelligence",
      },
      "/markets/rwas": {
        key: "page_titles.rwas",
        fallback: "Real World Assets",
      },
      "/markets/tokens": {
        key: "page_titles.tokens",
        fallback: "Token Analytics",
      },
      "/protocols/yields": {
        key: "page_titles.yields",
        fallback: "Yield Opportunities",
      },
      "/tools/portfolio": {
        key: "page_titles.portfolio",
        fallback: "Portfolio Analytics",
      },
      "/tools/metrics": {
        key: "page_titles.metrics",
        fallback: "Metrics",
      },
    };

    const config = pageConfig[pathname] || {
      key: "page_titles.whats",
      fallback: "What's",
    };
    const translation = t(config.key);
    return translation === config.key ? config.fallback : translation;
  }, [pathname, t]);

  return (
    <div className="flex items-center gap-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold">
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm flex items-center gap-2"
        >
          {isLandingPage ? (
            <>
              <Image
                src="/favicon.ico"
                alt="Logo"
                width={24}
                height={24}
                className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 rounded-full"
              />
              <span>
                <span className="text-muted-foreground">On </span>
                <span className="text-foreground">Aptos</span>
              </span>
            </>
          ) : (
            <>
              <span className="text-primary">{title}</span>{" "}
              <span className="text-muted-foreground">
                {t("landing.hero.title_suffix", "On Aptos")}
              </span>
            </>
          )}
        </Link>
      </h1>
      <GitHubStarCount
        owner={process.env.DEVELOPER_GITHUB?.split("/").slice(-2, -1)[0] || "yourusername"}
        repo={process.env.DEVELOPER_GITHUB?.split("/").slice(-1)[0] || "on-aptos"}
        className="hidden sm:flex"
        showGithubLogo={true}
      />
    </div>
  );
}
