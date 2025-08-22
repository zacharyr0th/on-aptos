"use client";

import { usePathname } from "next/navigation";

import { Header } from "./Header";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Don't show header on home page
  const shouldShowHeader = pathname !== "/";

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowHeader && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
