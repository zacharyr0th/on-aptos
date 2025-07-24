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
    <div className="w-full max-w-6xl mx-auto text-center flex flex-col justify-center items-center space-y-6 sm:space-y-8 lg:space-y-10 px-4">
      {/* Main Title with enhanced design */}
      <div className="relative space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] sm:leading-tight">
            <span className="block text-foreground mb-1 sm:mb-2">
              Track Your Portfolio
            </span>
            <span className="block flex items-center justify-center flex-wrap gap-2 sm:gap-3">
              <span className="text-muted-foreground">on Aptos</span>
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

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
          Real-time portfolio tracking across DeFi protocols. Dedicated
          analytics for Stablecoins, Bitcoin, and RWAs.
        </p>
      </div>

      {/* Primary CTA */}
      <div className="space-y-3 sm:space-y-4 w-full">
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center px-2 max-w-2xl mx-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/portfolio" className="w-full sm:w-auto">
                <Button
                  size="default"
                  className="group relative overflow-hidden px-6 py-3.5 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 w-full min-h-[48px] touch-manipulation rounded-xl"
                  aria-label="Go to portfolio page to track your Aptos assets"
                >
                  <span className="relative z-10 flex items-center justify-center">
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
                className="px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-all duration-300 active:scale-95 w-full sm:w-auto min-h-[44px] touch-manipulation rounded-xl"
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
                className="px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-all duration-300 active:scale-95 w-full sm:w-auto min-h-[44px] touch-manipulation rounded-xl"
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
