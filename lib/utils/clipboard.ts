import { toast } from "sonner";

export async function copyToClipboard(
  text: string,
  label?: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label ? `${label} copied` : "Copied!");
    return true;
  } catch {
    toast.error("Failed to copy");
    return false;
  }
}

export async function copyWithCustomMessage(
  text: string,
  successMessage: string,
  errorMessage: string,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error(errorMessage);
    return false;
  }
}
