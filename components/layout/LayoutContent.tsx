"use client";

import { usePathname } from "next/navigation";

import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();

  // Home page (landing page) has its own custom layout
  const isHomePage = pathname === "/";
  
  // Main dashboard pages have their own Footer component
  const isDashboardPage = [
    "/portfolio",
    "/stables", 
    "/bitcoin",
    "/rwas",
    "/defi",
    "/yields",
    "/tokens"
  ].includes(pathname);

  // Show header on all pages except the landing page
  const showHeader = !isHomePage;
  
  // Show footer for API docs, error pages, and other misc pages
  // Hide footer for home and dashboard pages which have their own
  const showFooter = !isHomePage && !isDashboardPage;

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}