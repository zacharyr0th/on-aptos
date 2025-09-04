/**
 * Main components barrel export file
 * Provides clean access to commonly used components across the application
 */

// Layout components
export { Header } from "./layout/Header";
export { Footer } from "./layout/Footer";
export { ThemeProvider } from "./layout/theme-provider";
export { ThemeToggle } from "./layout/theme-toggle";

// Error handling
export { ErrorBoundary } from "./errors/ErrorBoundary";
export { RootErrorBoundary } from "./errors/RootErrorBoundary";
export { ErrorFallback } from "./errors/ErrorFallback";

// Wallet components
export { WalletConnectButton } from "./wallet/WalletConnectButton";
export { WalletProvider } from "./wallet/WalletProvider";

// Shared page components
export * from "./shared/pages";

// Common UI components (selective export)
export { Button } from "./ui/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
export { Badge } from "./ui/badge";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
export { Skeleton } from "./ui/skeleton";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
