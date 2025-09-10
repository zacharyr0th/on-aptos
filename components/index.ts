/**
 * Main components barrel export file
 * Provides clean access to commonly used components across the application
 */

// Error handling
export { ErrorBoundary } from "./errors/ErrorBoundary";
export { ErrorFallback } from "./errors/ErrorFallback";
export { RootErrorBoundary } from "./errors/RootErrorBoundary";
export { Footer } from "./layout/Footer";
// Layout components
export { Header } from "./layout/Header";
export { ThemeProvider } from "./layout/theme-provider";
export { ThemeToggle } from "./layout/theme-toggle";
// Shared page components
export * from "./shared/pages";
export { Badge } from "./ui/badge";
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
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export { Skeleton } from "./ui/skeleton";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
// Wallet components
export { WalletConnectButton } from "./wallet/WalletConnectButton";
export { WalletProvider } from "./wallet/WalletProvider";
