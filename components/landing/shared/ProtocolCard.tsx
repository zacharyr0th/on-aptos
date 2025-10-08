"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProtocolCardProps {
  logo: string;
  name: string;
  category: string;
  href?: string;
  badge?: string;
  stats?: {
    label: string;
    value: string;
  }[];
  children?: ReactNode;
  statsPosition?: "below" | "inline";
  className?: string;
}

export default function ProtocolCard({
  logo,
  name,
  category,
  href,
  badge,
  stats,
  children,
  statsPosition = "below",
  className,
}: ProtocolCardProps) {
  const cardContent = (
    <Card
      className={cn(
        "group relative p-4 sm:p-6 hover:shadow-lg transition-all duration-200 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30",
        className
      )}
    >
      {statsPosition === "below" ? (
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center flex-shrink-0">
                <img src={logo} alt={name} className="w-full h-full object-contain rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                  {name}
                </p>
                {badge && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{category}</p>
              {stats && stats.length > 0 && (
                <div className="mt-3 space-y-1">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-mono font-semibold text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {children}
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-background to-muted p-2 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center flex-shrink-0">
              <img src={logo} alt={name} className="w-full h-full object-contain rounded-full" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1 truncate">
              {name}
            </p>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
          <div className="flex flex-col items-end justify-center">{children}</div>
        </div>
      )}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </Card>
  );

  return href ? (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}
