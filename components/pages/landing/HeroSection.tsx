import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <div className="w-full max-w-5xl mx-auto text-center space-y-12">
      
      {/* Main Title with conversion focus */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="block text-foreground mb-2">
              Track Your Complete
            </span>
            <span className="block text-primary bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Aptos Portfolio
            </span>
          </h1>
        </div>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          See all your DeFi positions, NFTs, and tokens in one place. Real-time tracking across 25+ protocols including Thala, Amnis, PancakeSwap, and more.
        </p>
      </div>

      {/* Primary CTA */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/portfolio">
            <Button 
              size="lg" 
              className="group relative overflow-hidden px-10 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center">
                Track Your Portfolio
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            className="px-8 py-6 text-lg font-semibold hover:bg-muted/50 transition-all duration-300"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            See Features
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>No signup required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Works with all Aptos wallets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>100% free forever</span>
          </div>
        </div>
      </div>

      {/* Subtle bottom spacing element */}
      <div className="pt-8">
        <div className="w-px h-12 bg-gradient-to-b from-border to-transparent mx-auto opacity-30" />
      </div>

    </div>
  );
};