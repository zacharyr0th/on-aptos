import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl text-muted-foreground">Page Not Found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        The page you're looking for doesn't exist. You might want to check out
        our dashboards instead.
      </p>
      <div className="flex gap-4 mt-4">
        <Link
          href="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Home
        </Link>
        <Link
          href="/portfolio"
          className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          Portfolio
        </Link>
      </div>
    </div>
  );
}

// This ensures the page is statically generated and cached
export const dynamic = "force-static";
export const revalidate = 86400; // Revalidate once per day
