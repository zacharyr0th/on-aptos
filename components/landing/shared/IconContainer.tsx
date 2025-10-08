import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconContainerProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal";
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
  lg: "w-16 h-16",
};

const iconSizeClasses = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
  lg: "w-8 h-8",
};

export default function IconContainer({
  icon: Icon,
  size = "md",
  variant = "default",
  className,
}: IconContainerProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200",
          className
        )}
      >
        <Icon className={cn(iconSizeClasses[size], "text-primary")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-200",
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], "text-primary")} />
    </div>
  );
}
