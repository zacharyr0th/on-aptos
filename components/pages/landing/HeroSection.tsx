import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";


export const HeroSection = () => {
  const { t } = useTranslation("common");

  return (
    <div className="w-full text-center flex flex-col justify-center items-center space-y-6 sm:space-y-8 lg:space-y-10 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20">
      {/* Main Title with enhanced design */}
      <div className="relative space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full overflow-hidden p-2 bg-background border border-border">
              <Image
                src="/icons/icon-512x512.png"
                alt="Logo"
                width={512}
                height={512}
                className="h-full w-full object-cover scale-150 rounded-full"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] sm:leading-tight">
            <span className="block text-foreground mb-1 sm:mb-2">
              {t("portfolio.landing.title", "Track Your Portfolio")}
            </span>
            <span className="block flex items-center justify-center flex-wrap gap-2 sm:gap-3">
              <span className="text-muted-foreground">
                {t("portfolio.landing.subtitle", "on Aptos")}
              </span>
              <Image
                src="/icons/apt.png"
                alt="Aptos"
                width={40}
                height={40}
                className="inline-block align-middle w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 dark:invert"
              />
            </span>
          </h1>
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
          {t(
            "portfolio.landing.description",
            "Real-time portfolio tracking across DeFi protocols & dedicated analytics for Stablecoins, Bitcoin, and RWAs.",
          )}
        </p>
      </div>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link href="/portfolio">
          <Button
            size="lg"
            className="font-medium"
            aria-label="Go to portfolio page to track your Aptos assets"
          >
            {t("portfolio.landing.cta_track", "Track Your Portfolio")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="lg"
          className="font-medium text-muted-foreground hover:text-foreground"
          onClick={() =>
            document
              .getElementById("features")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Scroll to features section"
        >
          {t("portfolio.landing.cta_features", "See Features")}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="font-medium text-muted-foreground hover:text-foreground"
          onClick={() =>
            document
              .getElementById("icon-sections")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Scroll to dashboards section"
        >
          {t("portfolio.landing.cta_dashboards", "View Dashboards")}
        </Button>
      </div>
    </div>
  );
};
