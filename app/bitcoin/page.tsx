import BitcoinPage from "@/components/pages/btc/Page";

// Static generation with 1-hour revalidation for better performance
export const revalidate = 3600;

export default function Page() {
  return <BitcoinPage />;
}
