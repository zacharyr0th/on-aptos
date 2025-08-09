import HomepageDesign from "@/components/pages/landing/Page";

// Static generation for fastest performance
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate hourly for fresh stats

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <HomepageDesign />
    </div>
  );
}
