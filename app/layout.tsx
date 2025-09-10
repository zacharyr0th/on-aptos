import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import type React from "react";
import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { LayoutContent } from "@/components/layout/LayoutContent";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { APP_CONFIG, DEVELOPER_CONFIG } from "@/lib/config/app";
import { APP_ROUTES } from "@/lib/config/routes";

import "./globals.css";

// Load fonts with CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Force Node.js runtime for layout
export const runtime = "nodejs";

// Enhanced page metadata for better SEO and PWA
export const metadata: Metadata = {
  title: {
    default:
      "On Aptos - Professional Blockchain Analytics | Institutional-Grade Portfolio Tracking",
    template: "%s | On Aptos - Professional Analytics",
  },
  description:
    "Professional-grade blockchain analytics for institutional investors and advanced traders. Real-time portfolio tracking, DeFi intelligence, and comprehensive market analysis across 25+ Aptos protocols.",
  keywords: [
    "Aptos",
    "blockchain analytics",
    "institutional portfolio tracking",
    "professional DeFi analytics",
    "enterprise blockchain data",
    "cryptocurrency portfolio management",
    "real-time market intelligence",
    "institutional-grade analytics",
    "professional trading tools",
    "advanced portfolio metrics",
    "DeFi intelligence platform",
    "blockchain portfolio analytics",
    "crypto asset management",
    "professional traders",
    "institutional investors",
    "portfolio performance tracking",
    "yield optimization",
    "risk assessment tools",
  ],
  authors: [
    {
      name: DEVELOPER_CONFIG.name,
      url: DEVELOPER_CONFIG.website,
    },
  ],
  creator: DEVELOPER_CONFIG.name,
  publisher: "On Aptos",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://onaptos.com"),
  alternates: {
    canonical: "/",
    types: {
      "application/ld+json": APP_ROUTES.API.SEO.LLM_METADATA,
      "text/plain": APP_ROUTES.API.SEO.LLM_README,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "On Aptos - Professional Blockchain Analytics Platform",
    description:
      "Institutional-grade portfolio tracking and DeFi intelligence. Professional analytics for advanced traders and institutional investors on Aptos blockchain.",
    siteName: "On Aptos",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "On Aptos - Professional Blockchain Analytics Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "On Aptos - Professional Blockchain Analytics",
    description:
      "Institutional-grade portfolio tracking and professional DeFi analytics for advanced traders and institutional investors.",
    creator: DEVELOPER_CONFIG.twitter,
    site: "@onaptos",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
      noimageindex: false,
    },
  },
  verification: {
    // Add your verification tokens here when you have them
    // google: 'verification-token',
    // yandex: 'verification-token',
    // yahoo: 'verification-token',
  },
  // PWA metadata
  applicationName: "On Aptos",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "On Aptos",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    // Custom metadata for LLMs
    "llm-documentation": "/api/seo/llms.txt",
    "api-documentation": "/api-spec",
    developer: DEVELOPER_CONFIG.name,
    "developer-website": DEVELOPER_CONFIG.website,
    "developer-twitter": DEVELOPER_CONFIG.twitter,
    "developer-github": DEVELOPER_CONFIG.github,
    "developer-linkedin": DEVELOPER_CONFIG.linkedin,
    "developer-email": DEVELOPER_CONFIG.email,
  },
};

// PWA viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({
  children,
}: RootLayoutProps): Promise<React.ReactElement> {
  // Get nonce from headers
  const nonce = (await headers()).get("x-nonce");

  // Structured data for the entire site
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://onaptos.com/#website",
        url: "https://onaptos.com",
        name: "On Aptos",
        description:
          "Professional blockchain analytics and institutional-grade portfolio tracking for Aptos",
        publisher: {
          "@id": "https://onaptos.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://onaptos.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://onaptos.com/#organization",
        name: "On Aptos",
        url: APP_CONFIG.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${APP_CONFIG.siteUrl}/logo.png`,
        },
        founder: {
          "@type": "Person",
          name: DEVELOPER_CONFIG.name,
          url: DEVELOPER_CONFIG.website,
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/app/icon-192x192.png" />
        <link rel="alternate" type="text/plain" href={APP_ROUTES.API.SEO.LLM_README} />
        <link rel="alternate" type="application/ld+json" href={APP_ROUTES.API.SEO.LLM_METADATA} />
        <meta name="author" content={DEVELOPER_CONFIG.name} />
        <Script
          id="structured-data"
          type="application/ld+json"
          nonce={nonce || undefined}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <WalletProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <LayoutContent>{children}</LayoutContent>
                  </ErrorBoundary>
                </TooltipProvider>
                <Analytics />
              </WalletProvider>
            </QueryProvider>
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
