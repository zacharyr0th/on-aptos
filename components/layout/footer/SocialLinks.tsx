"use client";

import React, { memo, useMemo } from "react";

import { FaGlobe, FaGithub, FaXTwitter } from "@/components/icons/SocialIcons";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { DEVELOPER_CONFIG } from "@/lib/config/app";

const SocialLink = memo(function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactElement;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 sm:p-2.5 -m-2 sm:-m-2.5 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md touch-manipulation"
      aria-label={label}
    >
      {icon}
    </a>
  );
});

interface SocialLinksProps {
  className?: string;
}

export const SocialLinks = memo(function SocialLinks({
  className = "",
}: SocialLinksProps) {
  const { t } = useTranslation("common");

  const socialLinks = useMemo(
    () =>
      [
        DEVELOPER_CONFIG.website && {
          href: DEVELOPER_CONFIG.website,
          icon: <FaGlobe className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.visit_personal_website"),
        },
        DEVELOPER_CONFIG.github && {
          href: DEVELOPER_CONFIG.github,
          icon: <FaGithub className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.view_github"),
        },
        DEVELOPER_CONFIG.twitter && {
          href: DEVELOPER_CONFIG.twitter,
          icon: <FaXTwitter className="w-4 h-4 sm:w-5 sm:h-5" />,
          label: t("actions.follow_on_twitter"),
        },
      ].filter(Boolean),
    [t],
  );

  return (
    <div className={`flex items-center gap-2 xl:gap-3 ${className}`}>
      {socialLinks.filter(Boolean).map((link, index) => {
        const validLink = link as {
          href: string;
          icon: React.ReactElement;
          label: string;
        };
        return (
          <SocialLink
            key={index}
            href={validLink.href}
            icon={validLink.icon}
            label={validLink.label}
          />
        );
      })}
    </div>
  );
});
