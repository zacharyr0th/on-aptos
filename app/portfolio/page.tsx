import { redirect } from "next/navigation";

// Redirect old portfolio route to new tools/portfolio location
export default function PortfolioRedirect() {
  redirect("/tools/portfolio");
}
