import React, { ReactNode } from 'react';
import { Geist } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { TRPCProvider } from '@/components/providers/TRPCProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { APP_CONFIG, DEVELOPER_CONFIG } from '@/lib/config/app';
import { headers } from 'next/headers';

// Load font with CSS variable
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Enhanced page metadata for better SEO and PWA
export const metadata: Metadata = {
  title: {
    default: "On Aptos - Real-time Blockchain Analytics | What's on Aptos?",
    template: '%s | On Aptos - Blockchain Analytics',
  },
  description:
    'Real-time analytics for Bitcoin, DeFi, LST, and Stablecoins on Aptos blockchain. Track token supplies, prices, and market data with our comprehensive API and dashboards.',
  keywords: [
    'Aptos',
    'blockchain',
    'DeFi',
    'Bitcoin',
    'LST',
    'Stablecoins',
    'cryptocurrency',
    'blockchain analytics',
    'token tracking',
    'real-time data',
    'API',
    'xBTC',
    'SBTC',
    'aBTC',
    'USDT',
    'USDC',
    'USDe',
    'amAPT',
    'stAPT',
  ],
  authors: [
    {
      name: DEVELOPER_CONFIG.name,
      url: DEVELOPER_CONFIG.website,
    },
  ],
  creator: DEVELOPER_CONFIG.name,
  publisher: 'On Aptos',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://onaptos.com'
  ),
  alternates: {
    canonical: '/',
    types: {
      'application/ld+json': '/api/seo/llm-metadata',
      'text/plain': '/api/seo/llm-readme',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'On Aptos - Real-time Blockchain Analytics',
    description:
      'Real-time analytics for Bitcoin, DeFi, LST, and Stablecoins on Aptos blockchain. Track token supplies, prices, and market data.',
    siteName: 'On Aptos',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'On Aptos - Blockchain Analytics Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'On Aptos - Real-time Blockchain Analytics',
    description:
      'Real-time analytics for Bitcoin, DeFi, LST, and Stablecoins on Aptos blockchain.',
    creator: DEVELOPER_CONFIG.twitter,
    site: '@onaptos',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
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
  applicationName: 'On Aptos',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'On Aptos',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    // Custom metadata for LLMs
    'llm-documentation': '/api/seo/llms.txt',
    'api-documentation': '/api-spec',
    developer: DEVELOPER_CONFIG.name,
    'developer-website': DEVELOPER_CONFIG.website,
    'developer-twitter': DEVELOPER_CONFIG.twitter,
    'developer-github': DEVELOPER_CONFIG.github,
    'developer-linkedin': DEVELOPER_CONFIG.linkedin,
    'developer-email': DEVELOPER_CONFIG.email,
  },
};

// PWA viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({
  children,
}: RootLayoutProps): Promise<React.ReactElement> {
  // Get nonce from headers
  const nonce = (await headers()).get('x-nonce');
  
  // Structured data for the entire site
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://onaptos.com/#website',
        url: 'https://onaptos.com',
        name: 'On Aptos',
        description: 'Real-time blockchain analytics for Aptos',
        publisher: {
          '@id': 'https://onaptos.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://onaptos.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://onaptos.com/#organization',
        name: 'On Aptos',
        url: APP_CONFIG.siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${APP_CONFIG.siteUrl}/logo.png`,
        },
        founder: {
          '@type': 'Person',
          name: DEVELOPER_CONFIG.name,
          url: DEVELOPER_CONFIG.website,
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="alternate" type="text/plain" href="/api/seo/llm-readme" />
        <link
          rel="alternate"
          type="application/ld+json"
          href="/api/seo/llm-metadata"
        />
        <meta name="author" content={DEVELOPER_CONFIG.name} />
        <Script
          id="structured-data"
          type="application/ld+json"
          nonce={nonce || undefined}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Explicit manifest link (Next.js also injects) */}
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <TRPCProvider>
          <I18nProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <main>{children}</main>
              <Toaster />
              <Analytics />
            </ThemeProvider>
          </I18nProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
