"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WalletCardProps {
  logo: string;
  name: string;
  description: string;
  href: string;
  recommended?: boolean;
  invertLogoInDarkMode?: boolean;
  className?: string;
}

export default function WalletCard({
  logo,
  name,
  description,
  href,
  recommended = false,
  invertLogoInDarkMode = false,
  className,
}: WalletCardProps) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      <Card
        className={cn(
          "group relative p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-200 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30",
          className
        )}
      >
        {recommended && (
          <Badge variant="default" className="absolute top-3 right-3 text-xs">
            Recommended
          </Badge>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative mt-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-background to-muted p-3 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center">
              <img
                src={logo}
                alt={name}
                className={cn(
                  "w-full h-full object-contain rounded-full",
                  invertLogoInDarkMode && "dark:invert"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </Card>
    </Link>
  );
}
