import DeFiPage from '@/components/pages/defi/Page';
import { Metadata } from 'next';

// Revalidate every 15 minutes for DeFi TVL and protocol data
export const revalidate = 900;

export const metadata: Metadata = {
  title: 'DeFi Analytics',
  description:
    'Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem. Real-time analytics for DEXs, lending protocols, and yield farms.',
  openGraph: {
    title: 'DeFi Analytics | On Aptos',
    description:
      'Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem. Real-time analytics for DEXs, lending protocols, and yield farms.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeFi Analytics | On Aptos',
    description:
      'Track protocols, TVL, yields, and activity across the Aptos DeFi ecosystem.',
  },
};

export default function Page() {
  return <DeFiPage />;
}
