import RWAsPageComponent from '@/components/pages/rwas/Page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real World Assets Analytics',
  description:
    'Track tokenized real world assets (RWAs) on Aptos blockchain. Monitor treasury bills, commodities, real estate, and other asset-backed tokens.',
  openGraph: {
    title: 'Real World Assets Analytics | On Aptos',
    description:
      'Track tokenized real world assets (RWAs) on Aptos blockchain. Monitor treasury bills, commodities, real estate, and other asset-backed tokens.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real World Assets Analytics | On Aptos',
    description:
      'Track tokenized real world assets (RWAs) on Aptos blockchain.',
  },
};

export default function RWAsPage() {
  return <RWAsPageComponent />;
}
