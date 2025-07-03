import { useCallback } from 'react';
import { toast } from 'sonner';

export function useTokenDialog(onClose?: () => void) {
  const handleCopy = useCallback(async (text: string, label: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label} to clipboard`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return {
    handleCopy,
    handleClose,
  };
}
