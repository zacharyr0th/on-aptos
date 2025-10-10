"use client";

import { usePathname } from "next/navigation";

import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();

  // Portfolio page needs special handling for single viewport
  const isPortfolioPage = pathname === "/tools/portfolio";
  const isMetricsPage = pathname === "/metrics";
  const isSingleViewport = isPortfolioPage;

  // Hide header and footer on metrics page (it has its own rotation)
  const showHeader = !isMetricsPage;
  const showFooter = !isMetricsPage;

  // Use h-screen for portfolio and home pages to enforce single viewport
  const containerClass = isSingleViewport
    ? "h-screen flex flex-col overflow-hidden"
    : "min-h-screen flex flex-col";

  return (
    <div className={containerClass}>
      {showHeader && <Header />}
      <main className={isSingleViewport ? "flex-1 overflow-hidden" : "flex-1"}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
