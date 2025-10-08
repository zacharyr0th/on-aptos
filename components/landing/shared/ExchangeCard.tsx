"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ExchangeCardProps {
  logo?: string;
  name: string;
  region: "US" | "KR" | "Global";
  usdt?: "Y" | "N" | "";
  usdc?: "Y" | "N" | "";
  link?: string;
  className?: string;
}

export default function ExchangeCard({
  logo,
  name,
  region,
  usdt,
  usdc,
  link,
  className,
}: ExchangeCardProps) {
  const getBadgeVariant = () => {
    if (region === "US") return "default";
    if (region === "KR") return "secondary";
    return "outline";
  };

  const getRegionLabel = () => {
    if (region === "US") return "🇺🇸 US";
    if (region === "KR") return "🇰🇷 Korea";
    return "🌍 Global";
  };

  const cardContent = (
    <Card
      className={cn(
        "group relative p-4 sm:p-6 hover:shadow-lg transition-all duration-200 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30",
        className
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Regional Badge */}
        <Badge variant={getBadgeVariant()} className="absolute top-3 right-3 text-xs">
          {getRegionLabel()}
        </Badge>

        {/* Exchange Logo with enhanced styling */}
        <div className="relative mt-2">
          {logo ? (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-muted p-2.5 shadow-md group-hover:shadow-lg transition-all duration-200 flex items-center justify-center">
              <img src={logo} alt={name} className="w-full h-full object-contain rounded-full" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-md">
              <Globe className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>

        {/* Supported Assets Section */}
        <div className="w-full pt-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Supported Assets</p>
          <div className="flex gap-2 justify-center items-center">
            <div className="relative group/icon">
              <img
                src="/icons/apt.png"
                alt="APT"
                className="w-7 h-7 rounded-full dark:invert transition-transform group-hover/icon:scale-110"
              />
            </div>
            {usdt === "Y" && (
              <div className="relative group/icon">
                <img
                  src="/icons/stables/usdt.png"
                  alt="USDT"
                  className="w-7 h-7 rounded-full transition-transform group-hover/icon:scale-110"
                />
              </div>
            )}
            {usdc === "Y" && (
              <div className="relative group/icon">
                <img
                  src="/icons/stables/usdc.png"
                  alt="USDC"
                  className="w-7 h-7 rounded-full transition-transform group-hover/icon:scale-110"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </Card>
  );

  return link ? (
    <Link href={link} target="_blank" rel="noopener noreferrer">
      {cardContent}
    </Link>
  ) : (
    <div>{cardContent}</div>
  );
}
