import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

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

  // Convert tRPC procedure names to REST API URLs that internally use tRPC
  const getApiUrl = (endpoint: string) => {
    // Now we're directly passing API URLs, so just return them as-is
    return endpoint;
  };

  const handleSectionClick = () => {
    router.push(route);
  };

  const handleApiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!underConstruction) {
      window.open(getApiUrl(apiEndpoint), '_blank', 'noreferrer');
    }
  };

  return (
    <div
      onClick={handleSectionClick}
      className="block group bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black hover:border-black/20 dark:hover:border-white/20 transition-all duration-500 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10 hover:-translate-y-1 cursor-pointer h-[280px] w-full flex flex-col relative overflow-hidden"
    >
      {/* Header */}
      <div className={`mb-4 ${description ? 'space-y-2' : ''}`}>
        <h3 className="text-xl sm:text-2xl font-semibold text-black dark:text-white group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-base text-black/70 dark:text-white/70 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Icons grid - flex-grow to take up remaining space */}
      <div className="flex justify-center items-center mb-4 flex-grow">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-fit">
          {icons.map((icon, iconIndex) => {
            // Check if icon is SVG data URI (DeFi card icons)
            const isSvgIcon = icon.src.startsWith('data:image/svg+xml');

            return (
              <div
                key={iconIndex}
                className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-black rounded-xl shadow-sm border border-black/20 dark:border-white/20 group-hover:shadow-md group-hover:scale-105 transition-all duration-300"
              >
                <Image
                  src={icon.src}
                  alt={icon.name}
                  width={28}
                  height={28}
                  className={`rounded-sm w-7 h-7 sm:w-8 sm:h-8 object-contain ${isSvgIcon ? 'dark:invert' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* API endpoint or Coming Soon - clickable - fixed at bottom */}
      <div className="text-xs sm:text-sm text-black/60 dark:text-white/60 bg-white/50 dark:bg-black/50 rounded-xl px-4 py-2 border border-black/10 dark:border-white/10 font-mono group-hover:bg-white/70 dark:group-hover:bg-black/70 transition-colors duration-300 mt-auto">
        {underConstruction ? (
          <div className="text-center">
            <span className="text-black/80 dark:text-white/80 font-medium">
              {t('labels.coming_soon')}
            </span>
          </div>
        ) : (
          <>
            <span className="text-black/40 dark:text-white/40">
              {t('labels.api')}:
            </span>{' '}
            <button
              onClick={handleApiClick}
              className="text-black/80 dark:text-white/80 hover:text-primary dark:hover:text-primary underline decoration-dotted underline-offset-2 transition-colors duration-200 bg-transparent border-none p-0 font-mono text-xs sm:text-sm cursor-pointer"
              aria-label={t(
                'labels.open_api_endpoint',
                'Open API endpoint in new tab'
              )}
            >
              {apiEndpoint}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
