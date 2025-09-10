import type { Metadata } from "next";

interface PageConfig {
  title: string;
  description?: string;
  Component: React.ComponentType<any>;
  dynamic?: "force-static" | "force-dynamic" | "error" | "auto";
  revalidate?: number;
}

export function createPage(config: PageConfig) {
  const { title, description, Component, dynamic, revalidate } = config;

  // Generate metadata
  const metadata: Metadata = {
    title,
    description,
  };

  // Create the page component
  const PageComponent = (props: any) => <Component {...props} />;

  // Set dynamic behavior if specified
  if (dynamic) {
    (PageComponent as any).dynamic = dynamic;
  }

  // Set revalidate if specified
  if (revalidate) {
    (PageComponent as any).revalidate = revalidate;
  }

  return {
    metadata,
    default: PageComponent,
  };
}
