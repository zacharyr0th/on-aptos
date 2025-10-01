import { OnboardingPage } from "@/components/layout/header/OnboardingPage";

export default function Welcome() {
  return <OnboardingPage />;
}

export const metadata = {
  title: "Welcome to Aptos | OnAptos",
  description: "Your gateway to the fastest, most secure, and developer-friendly blockchain platform. Discover DeFi, track your portfolio, and explore the future of Web3.",
  keywords: ["Aptos", "blockchain", "DeFi", "Web3", "cryptocurrency", "portfolio", "welcome"],
  openGraph: {
    title: "Welcome to Aptos | OnAptos",
    description: "Your gateway to the fastest, most secure, and developer-friendly blockchain platform.",
    type: "website",
  },
};