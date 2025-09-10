import { useCallback, useState } from "react";

import { useTranslation } from "@/lib/hooks/useTranslation";

export function useAddressValidation() {
  const { t } = useTranslation("common");
  const [addressError, setAddressError] = useState<string>("");

  const validateAddress = useCallback(
    (address: string): boolean => {
      if (!address) {
        setAddressError(t("wallet.error_empty_address", "Please enter an address"));
        return false;
      }

      const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
      const isValid = /^0x[a-fA-F0-9]{64}$/.test(cleanAddress);

      if (!isValid) {
        setAddressError(t("wallet.error_invalid_format", "Invalid address format"));
        return false;
      }

      setAddressError("");
      return true;
    },
    [t]
  );

  const normalizeAddress = useCallback((address: string | undefined): string | undefined => {
    if (!address) return undefined;
    return !address.startsWith("0x") ? `0x${address}` : address;
  }, []);

  const clearError = useCallback(() => {
    setAddressError("");
  }, []);

  return {
    validateAddress,
    normalizeAddress,
    addressError,
    setAddressError,
    clearError,
  };
}
