"use client";

import type React from "react";

import { ErrorBoundary } from "./ErrorBoundary";

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return <ErrorBoundary level="page">{children}</ErrorBoundary>;
}
