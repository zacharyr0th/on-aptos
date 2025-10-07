"use client";

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import IconContainer from "./IconContainer";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string | ReactNode;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card via-card to-card/80 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <IconContainer icon={icon} />
        <div>
          <h3 className="font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-foreground/70 leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
