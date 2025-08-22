"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={true}
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toast]:bg-green-50 group-[.toast]:text-green-900 dark:group-[.toast]:bg-green-900 dark:group-[.toast]:text-green-50",
          error:
            "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 dark:group-[.toast]:bg-red-900 dark:group-[.toast]:text-red-50",
        },
        style: {
          zIndex: 99999,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
