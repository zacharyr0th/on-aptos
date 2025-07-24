import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Construction } from 'lucide-react';

interface Icon {
  name: string;
  src: string;
  color?: string;
}

interface IconSectionProps {
  title: string;
  description?: string;
  apiEndpoint: string;
  route: string;
  icons: Icon[];
  underConstruction?: boolean;
}

export const IconSection = ({
  title,
  description,
  apiEndpoint,
  route,
  icons,
  underConstruction,
}: IconSectionProps) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const handleSectionClick = () => {
    router.push(route);
  };

  const handleApiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!underConstruction) {
      window.open(apiEndpoint, '_blank', 'noreferrer');
    }
  };

  return (
    <Card
      className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg active:scale-95 cursor-pointer bg-card/50 backdrop-blur-sm h-[180px] sm:h-[200px] lg:h-[240px] flex flex-col touch-manipulation rounded-xl"
      onClick={handleSectionClick}
    >
      {/* Status Badge */}
      {underConstruction && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-1">
            <Construction className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
      )}

      <CardHeader className="pb-1 sm:pb-2 flex-shrink-0 h-[45px] sm:h-[50px] lg:h-[60px] flex flex-col justify-center p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold group-hover:text-primary transition-colors truncate pr-1">
              {title}
            </CardTitle>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-start px-4 sm:px-5 lg:px-6 pt-2 sm:pt-3 pb-4 sm:pb-5 lg:pb-6">
        {/* Protocol Icons */}
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 max-w-fit">
            {icons.slice(0, 4).map((icon, iconIndex) => {
              const isSvgIcon = icon.src.startsWith('data:image/svg+xml');

              return (
                <div
                  key={iconIndex}
                  className="relative group/icon flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-background border border-border/60 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation hover:border-primary/30"
                >
                  <Image
                    src={icon.src}
                    alt={icon.name}
                    width={36}
                    height={36}
                    className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 object-contain transition-transform duration-300 group-hover/icon:scale-110 ${isSvgIcon || icon.name === 'APT' ? 'dark:invert' : ''}`}
                  />

                  {/* Tooltip - Hidden on mobile */}
                  <div className="hidden lg:block absolute -top-9 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1.5 rounded-lg border border-border/60 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 shadow-md">
                    {icon.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
