import { redirect } from "next/navigation";

// Redirect old RWAs route to new markets/rwas location
export default function RWAsRedirect() {
  redirect("/markets/rwas");
}
