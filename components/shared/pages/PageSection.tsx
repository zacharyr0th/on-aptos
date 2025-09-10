"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PageSectionProps } from "./types";

export function PageSection({
  title,
  description,
  children,
  className,
  actions,
}: PageSectionProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description || actions) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && <div className="ml-auto">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && "pt-6")}>{children}</CardContent>
    </Card>
  );
}
