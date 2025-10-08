"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sectionHeader, sectionHeaderSubtle } from "./animations";

interface SectionHeaderProps {
  title: string;
  description?: string | ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "subtle";
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  variant = "default",
  className,
}: SectionHeaderProps) {
  const animation = variant === "subtle" ? sectionHeaderSubtle : sectionHeader;

  return (
    <motion.div className={cn("text-center mb-16", className)} {...animation}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed font-light">
          {description}
        </p>
      )}
    </motion.div>
  );
}
