"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Since dashboard functionality is not currently implemented,
// redirect to the main tools/portfolio page
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tools/portfolio");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to portfolio...</p>
      </div>
    </div>
  );
}
