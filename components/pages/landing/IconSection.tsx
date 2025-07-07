import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Construction,
  BarChart3,
  Code
} from 'lucide-react';

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
      className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer bg-card/50 backdrop-blur-sm h-[240px] flex flex-col"
      onClick={handleSectionClick}
    >
      {/* Status Badge */}
      {underConstruction && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="text-xs">
            <Construction className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate">
              {title}
            </CardTitle>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
          </div>
        </div>
        
        {description && (
          <CardDescription className="text-sm leading-relaxed line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4">
        {/* Protocol Icons */}
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-2 max-w-fit">
            {icons.slice(0, 4).map((icon, iconIndex) => {
              const isSvgIcon = icon.src.startsWith('data:image/svg+xml');

              return (
                <div
                  key={iconIndex}
                  className="relative group/icon flex items-center justify-center w-10 h-10 bg-background border border-border rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                >
                  <Image
                    src={icon.src}
                    alt={icon.name}
                    width={20}
                    height={20}
                    className={`w-5 h-5 object-contain transition-transform duration-300 group-hover/icon:scale-110 ${isSvgIcon ? 'dark:invert' : ''}`}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                    {icon.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Dashboard Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="group/btn flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleSectionClick();
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>

          {/* API Button */}
          {!underConstruction && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-3"
              onClick={handleApiClick}
            >
              <Code className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};