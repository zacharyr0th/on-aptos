import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowRight, TrendingUp, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <div className="w-full max-w-6xl mx-auto text-center flex flex-col justify-center items-center space-y-8 sm:space-y-10 lg:space-y-12 px-4">
      {/* Main Title with enhanced design */}
      <div className="relative space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
            <span className="block text-foreground mb-2">
              Track Your Portfolio
            </span>
            <span className="block flex items-center justify-center flex-wrap gap-2 sm:gap-4">
              <span className="text-muted-foreground">on Aptos</span>
              <Image
                src="/icons/apt.png"
                alt="Aptos"
                width={48}
                height={48}
                className="inline-block align-middle w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 dark:invert"
              />
            </span>
          </h1>
        </div>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
          Real-time portfolio tracking across DeFi protocols. Dedicated
          analytics for Stablecoins, Bitcoin, RWAs, and LSTs.
        </p>
      </div>

      {/* Primary CTA */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/portfolio">
                <Button
                  size="default"
                  className="group relative overflow-hidden px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  aria-label="Go to portfolio page to track your Aptos assets"
                >
                  <span className="relative z-10 flex items-center">
                    Track Your Portfolio
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Connect your wallet to see all your DeFi positions, NFTs, and
                tokens
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-muted/50 transition-all duration-300 w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById('features')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                aria-label="Scroll to features section"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                See Features
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Scroll down to see all available tracking features</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-muted/50 transition-all duration-300 w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById('icon-sections')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                aria-label="Scroll to dashboards section"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                View Dashboards
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Explore our analytics dashboards</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
