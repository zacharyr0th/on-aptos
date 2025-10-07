"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import IconContainer from "./IconContainer";

interface CTACardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  className?: string;
}

export default function CTACard({ icon, title, description, href, className }: CTACardProps) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "group p-6 hover:shadow-lg transition-all duration-200 h-full bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/30",
          className
        )}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <IconContainer icon={icon} size="lg" />
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
