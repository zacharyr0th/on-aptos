import LSTPage from '@/components/pages/lst/Page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liquid Staking Analytics',
  description:
    'Track liquid staking tokens (LSTs) on Aptos blockchain. Real-time analytics for stAPT, thAPT, amAPT, and other liquid staking derivatives.',
  openGraph: {
    title: 'Liquid Staking Analytics | On Aptos',
    description:
      'Track liquid staking tokens (LSTs) on Aptos blockchain. Real-time analytics for stAPT, thAPT, amAPT, and other liquid staking derivatives.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liquid Staking Analytics | On Aptos',
    description: 'Track liquid staking tokens (LSTs) on Aptos blockchain.',
  },
};

export default function Page() {
  return <LSTPage />;
}
