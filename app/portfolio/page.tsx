import PortfolioPage from '@/components/pages/portfolio/Page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Analytics',
  description:
    'Track your Aptos wallet portfolio with real-time analytics. View your fungible assets, NFTs, and portfolio performance over time.',
  openGraph: {
    title: 'Portfolio Analytics | On Aptos',
    description:
      'Track your Aptos wallet portfolio with real-time analytics. View your fungible assets, NFTs, and portfolio performance over time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio Analytics | On Aptos',
    description: 'Track your Aptos wallet portfolio with real-time analytics.',
  },
};

export default function Page() {
  return <PortfolioPage />;
}
