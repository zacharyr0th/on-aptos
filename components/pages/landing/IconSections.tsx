import { useTranslation } from "@/hooks/useTranslation";

import { IconSection } from "./IconSection";

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

const getFallbackTitle = (key: string): string => {
  switch (key) {
    case "landing.sections.portfolio":
      return "Portfolio";
    case "landing.sections.tokens":
      return "Tokens";
    case "landing.sections.stablecoins":
      return "Stablecoins";
    case "landing.sections.bitcoin_assets":
      return "Bitcoin Assets";
    case "landing.sections.liquid_staking":
      return "Liquid Staking";
    case "landing.sections.rwas":
      return "Real World Assets";
    case "landing.sections.defi_protocols":
      return "DeFi Protocols";
    case "landing.sections.yields":
      return "Yields";
    default:
      return "";
  }
};

const getFallbackDescription = (key: string): string => {
  switch (key) {
    case "landing.sections.portfolio_description":
      return "Monitor your Aptos assets";
    case "landing.sections.tokens_description":
      return "Track all tokens on Aptos";
    case "landing.sections.stablecoins_description":
      return "Track stablecoin supplies";
    case "landing.sections.bitcoin_assets_description":
      return "Track Bitcoin assets";
    case "landing.sections.liquid_staking_description":
      return "Real World Assets";
    case "landing.sections.rwas_description":
      return "Track RWAs on Aptos";
    case "landing.sections.defi_protocols_description":
      return "Track DeFi on Aptos";
    case "landing.sections.yields_description":
      return "Discover yield opportunities";
    default:
      return "";
  }
};

export const IconSections = () => {
  const { t } = useTranslation("common");

  // Available token icons (excluding APT which is always shown)
  const availableTokenIcons = [
    { name: "LSD", src: "/icons/protocols/liquidswap.webp" },
    { name: "CELL", src: "/icons/protocols/cellana.webp" },
    { name: "ECHO", src: "/icons/protocols/echo.webp" },
    { name: "PANORA", src: "/icons/protocols/panora.webp" },
    { name: "KANA", src: "/icons/protocols/kana.webp" },
    { name: "MESO", src: "/icons/protocols/meso.webp" },
    { name: "ARIES", src: "/icons/protocols/aries.avif" },
  ];

  // Randomly select 3 tokens
  const getRandomTokens = () => {
    const shuffled = [...availableTokenIcons].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const randomTokens = getRandomTokens();

  const iconSections: IconSectionData[] = [
    {
      titleKey: "landing.sections.tokens",
      descriptionKey: "landing.sections.tokens_description",
      apiEndpoint: "/api/aptos/tokens",
      route: "/tokens",
      icons: [{ name: "APT", src: "/icons/apt.png" }, ...randomTokens],
    },
    {
      titleKey: "landing.sections.yields",
      descriptionKey: "landing.sections.yields_description",
      apiEndpoint: "/api/yields",
      route: "/yields",
      icons: [
        {
          name: "APY",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyIDEySDJNMjIgMTJMMTggOE0yMiAxMkwxOCAxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=",
        },
        {
          name: "Farming",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjIgN0wxMiAxMkwyIDdMMTIgMloiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMiAxN0wxMiAyMkwyMiAxNyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yIDEyTDEyIDE3TDIyIDEyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        },
        {
          name: "Staking",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgM1YyMUgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik05IDlMMTIgNkwxNiAxMEwyMiA0IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        },
        {
          name: "Vaults",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcgMTdMMTcgN00xNyA3SDE3TTE3IDdWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=",
        },
      ],
    },
    {
      titleKey: "landing.sections.stablecoins",
      descriptionKey: "landing.sections.stablecoins_description",
      apiEndpoint: "/api/aptos/stables",
      route: "/stables",
      icons: [
        { name: "USDC", src: "/icons/stables/usdc.webp" },
        { name: "USDT", src: "/icons/stables/usdt.webp" },
        { name: "USDe", src: "/icons/stables/usde.webp" },
        { name: "sUSDe", src: "/icons/stables/susde.webp" },
      ],
    },
    {
      titleKey: "landing.sections.bitcoin_assets",
      descriptionKey: "landing.sections.bitcoin_assets_description",
      apiEndpoint: "/api/aptos/btc",
      route: "/bitcoin",
      icons: [
        { name: "Bitcoin", src: "/icons/btc/bitcoin.webp" },
        { name: "Echo", src: "/icons/btc/echo.webp" },
        { name: "StakeStone", src: "/icons/btc/stakestone.webp" },
        { name: "OKX", src: "/icons/btc/okx.webp" },
      ],
    },
    {
      titleKey: "landing.sections.rwas",
      descriptionKey: "landing.sections.rwas_description",
      apiEndpoint: "/api/aptos/rwas",
      route: "/rwas",
      icons: [
        { name: "Pact", src: "/icons/rwas/pact.webp" },
        { name: "BlackRock", src: "/icons/rwas/blackrock.webp" },
        { name: "Franklin Templeton", src: "/icons/rwas/ft.webp" },
        { name: "Ondo", src: "/icons/rwas/ondo.webp" },
      ],
    },
    {
      titleKey: "landing.sections.defi_protocols",
      descriptionKey: "landing.sections.defi_protocols_description",
      apiEndpoint: "/api/defi/overview",
      route: "/defi",
      icons: [
        {
          name: "DEX",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTcgMTdMMTcgN00xNyA3SDE3TTE3IDdWMTciIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=",
        },
        {
          name: "Lending",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDFMMjIgNkwxMiAxMUwyIDZMMTIgMVoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMiAxN0wxMiAyMkwyMiAxNyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yIDEyTDEyIDE3TDIyIDEyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        },
        {
          name: "Yield",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyIDEySDJNMjIgMTJMMTggOE0yMiAxMkwxOCAxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=",
        },
        {
          name: "Analytics",
          src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgM1YyMUgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik05IDlMMTIgNkwxNiAxMEwyMiA0IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        },
      ],
    },
  ];

  return (
    <div id="dashboards" className="w-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 lg:gap-4">
        {iconSections.map((section, index) => (
          <div
            key={index}
            className="opacity-0 animate-fade-in-up w-full"
            style={{
              animationDelay: `${index * 75}ms`,
              animationFillMode: "both",
            }}
          >
            <IconSection
              title={t(section.titleKey, getFallbackTitle(section.titleKey))}
              description={
                section.descriptionKey
                  ? t(
                      section.descriptionKey,
                      getFallbackDescription(section.descriptionKey),
                    )
                  : undefined
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
