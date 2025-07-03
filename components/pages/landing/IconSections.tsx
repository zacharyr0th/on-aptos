import { IconSection } from './IconSection';
import { useTranslation } from '@/hooks/useTranslation';

interface Icon {
  name: string;
  src: string;
  color?: string;
}

interface IconSectionData {
  titleKey: string;
  descriptionKey?: string;
  apiEndpoint: string;
  route: string;
  icons: Icon[];
  underConstruction?: boolean;
}

export const IconSections = () => {
  const { t } = useTranslation('common');

  const iconSections: IconSectionData[] = [
    {
      titleKey: 'landing.sections.stablecoins',
      apiEndpoint: '/api/aptos/stables',
      route: '/stablecoins',
      icons: [
        { name: 'USDC', src: '/icons/stables/usdc.png' },
        { name: 'USDT', src: '/icons/stables/usdt.png' },
        { name: 'USDe', src: '/icons/stables/usde.png' },
        { name: 'sUSDe', src: '/icons/stables/susde.png' },
      ],
    },
    {
      titleKey: 'landing.sections.bitcoin_assets',
      apiEndpoint: '/api/aptos/btc',
      route: '/bitcoin',
      icons: [
        { name: 'Bitcoin', src: '/icons/btc/bitcoin.png' },
        { name: 'Echo', src: '/icons/btc/echo.png' },
        { name: 'StakeStone', src: '/icons/btc/stakestone.png' },
        { name: 'OKX', src: '/icons/btc/okx.png' },
      ],
    },
    {
      titleKey: 'landing.sections.rwas',
      descriptionKey: 'landing.sections.rwas_description',
      apiEndpoint: '/api/aptos/rwas',
      route: '/rwas',
      underConstruction: true,
      icons: [
        { name: 'Pact', src: '/icons/rwas/pact.png' },
        { name: 'BlackRock', src: '/icons/rwas/blackrock.png' },
        { name: 'Franklin Templeton', src: '/icons/rwas/ft.jpeg' },
        { name: 'Ondo', src: '/icons/rwas/ondo.jpeg' },
      ],
    },
    {
      titleKey: 'landing.sections.liquid_staking',
      apiEndpoint: '/api/aptos/lst',
      route: '/lst',
      icons: [
        { name: 'Thala', src: '/icons/lst/thala.png' },
        { name: 'Amnis', src: '/icons/lst/amnis.jpg' },
        { name: 'Kofi', src: '/icons/lst/kofi.png' },
        { name: 'Trufin', src: '/icons/lst/trufin.jpg' },
      ],
    },
    {
      titleKey: 'landing.sections.defi_protocols',
      apiEndpoint: '/api/defi/overview',
      route: '/defi',
      underConstruction: true,
      icons: [
        {
          name: 'Exchange',
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcgMTdMMTcgN00xNyA3SDE3TTE3IDdWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=',
        },
        {
          name: 'Lending',
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDFMMjIgNkwxMiAxMUwyIDZMMTIgMVoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMiAxN0wxMiAyMkwyMiAxNyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yIDEyTDEyIDE3TDIyIDEyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
        },
        {
          name: 'Yield',
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyIDEySDJNMjIgMTJMMTggOE0yMiAxMkwxOCAxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
        },
        {
          name: 'Analytics',
          src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgM1YyMUgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik05IDlMMTIgNkwxNiAxMEwyMiA0IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
        {iconSections.map((section, index) => (
          <div
            key={index}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'both',
            }}
          >
            <IconSection
              title={t(section.titleKey)}
              description={
                section.descriptionKey ? t(section.descriptionKey) : undefined
              }
              apiEndpoint={section.apiEndpoint}
              route={section.route}
              icons={section.icons}
              underConstruction={section.underConstruction}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
