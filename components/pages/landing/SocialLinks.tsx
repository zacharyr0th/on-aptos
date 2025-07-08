import { FaGlobe, FaXTwitter, FaGithub } from '@/components/icons/SocialIcons';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useTranslation } from '@/hooks/useTranslation';
import { DEVELOPER_CONFIG } from '@/lib/config/app';

export const SocialLinks = () => {
  const { t } = useTranslation('common');

  const socialLinks = [
    ...(DEVELOPER_CONFIG.website
      ? [
          {
            href: DEVELOPER_CONFIG.website,
            icon: FaGlobe,
            labelKey: 'actions.visit_personal_website',
            hoverColor: 'hover:text-blue-600 dark:hover:text-blue-400',
          },
        ]
      : []),
    ...(DEVELOPER_CONFIG.twitter
      ? [
          {
            href: `https://x.com/${DEVELOPER_CONFIG.twitter.replace('@', '')}`,
            icon: FaXTwitter,
            labelKey: 'actions.twitter_profile',
            hoverColor: 'hover:text-gray-900 dark:hover:text-white',
          },
        ]
      : []),
    ...(DEVELOPER_CONFIG.github
      ? [
          {
            href: DEVELOPER_CONFIG.github,
            icon: FaGithub,
            labelKey: 'actions.github_profile',
            hoverColor: 'hover:text-gray-900 dark:hover:text-white',
          },
        ]
      : []),
  ].filter(Boolean);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 py-6 sm:py-8 md:py-12">
        {/* Social links */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(link.labelKey)}
              className={`
                text-gray-400 dark:text-gray-500 
                ${link.hoverColor} 
                transition-all duration-300 
                hover:scale-110 
                focus:outline-none 
                focus:ring-2 
                focus:ring-primary/50 
                rounded-lg 
                p-2
                -m-2
              `}
            >
              <link.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
          ))}
        </div>

        {/* Theme toggle */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};
