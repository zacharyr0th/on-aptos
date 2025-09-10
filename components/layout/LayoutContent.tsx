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
  const isPortfolioPage = pathname === "/portfolio";

  // Show header and footer on all pages now (consolidated layout)
  const showHeader = true;
  const showFooter = true;

  // Use h-screen for portfolio page to enforce single viewport
  const containerClass = isPortfolioPage
    ? "h-screen flex flex-col overflow-hidden"
    : "min-h-screen flex flex-col";

  return (
    <div className={containerClass}>
      {showHeader && <Header />}
      <main className={isPortfolioPage ? "flex-1 overflow-hidden" : "flex-1"}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
