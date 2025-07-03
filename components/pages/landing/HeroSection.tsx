import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

export const HeroSection = () => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-8 text-center max-w-4xl mx-auto">
      {/* Main heading */}
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
          <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {t('landing.hero.title_prefix', "What's")}
          </span>{' '}
          <span className="text-muted-foreground">
            {t('landing.hero.title_suffix', 'on Aptos')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/80 font-medium max-w-2xl mx-auto leading-relaxed">
          {t('landing.hero.subtitle', 'Track real-time data across Aptos DeFi')}
        </p>
      </div>

      {/* Dashboard introduction */}
      <div className="space-y-3">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          {t('landing.hero.choose_dashboard', 'Choose your dashboard')}
        </Badge>
      </div>
    </div>
  );
};
