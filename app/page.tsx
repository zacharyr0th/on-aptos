import HomepageDesign from '@/components/pages/landing/Page';

// Static generation - no revalidation needed for home page
export const dynamic = 'force-static';

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <HomepageDesign />
    </div>
  );
}
