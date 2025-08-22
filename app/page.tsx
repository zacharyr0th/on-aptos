import ImprovedLandingPage from "@/components/pages/landing/ImprovedLandingPage";

// Static generation for fastest performance
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate hourly for fresh stats

export default function Home() {
  return <ImprovedLandingPage />;
}
