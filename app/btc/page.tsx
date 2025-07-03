import BitcoinPage from '@/components/pages/btc/Page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bitcoin Analytics',
  description:
    'Track Bitcoin supply, price, and wrapped BTC on Aptos blockchain. Real-time analytics for BTC bridges and cross-chain activity.',
  openGraph: {
    title: 'Bitcoin Analytics | On Aptos',
    description:
      'Track Bitcoin supply, price, and wrapped BTC on Aptos blockchain. Real-time analytics for BTC bridges and cross-chain activity.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bitcoin Analytics | On Aptos',
    description:
      'Track Bitcoin supply, price, and wrapped BTC on Aptos blockchain.',
  },
};

export default function Page() {
  return <BitcoinPage />;
}
