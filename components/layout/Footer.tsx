import { GeistMono } from "geist/font/mono";
import { FileText, Github, Lock, Mail, Shield, Twitter, Users } from "lucide-react";
import Link from "next/link";
import React, { type FC, memo, type ReactElement } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { DEVELOPER_CONFIG } from "@/lib/config/app";

import { ErrorBoundary } from "../errors/ErrorBoundary";

interface FooterProps {
  showAptosAttribution?: boolean;
  className?: string;
}

const FooterComponent: FC<FooterProps> = ({
  showAptosAttribution: _showAptosAttribution = true,
  className,
}): ReactElement => {
  const currentYear = new Date().getFullYear();

  return (
    <ErrorBoundary>
      <footer className={`w-full ${GeistMono.className} ${className || ""}`}>
        {/* Bottom Bar */}
        <div className="w-full py-2 sm:py-3">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
            <div className="flex items-center justify-between">
              {/* Left: Toggles and Copyright */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="hidden sm:inline md:hidden">© {currentYear} On Aptos</span>
                </div>
              </div>

              {/* Right: Built by */}
              <div className="text-sm text-muted-foreground">
                Built by{" "}
                <a
                  href="https://x.com/zacharyr0th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-foreground/80 transition-colors"
                >
                  @zacharyr0th
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </ErrorBoundary>
  );
};

FooterComponent.displayName = "FooterComponent";

export const Footer = memo(FooterComponent);
