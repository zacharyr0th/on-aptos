/**
 * Petra Wallet Error Handling
 * Based on: https://petra.app/docs/identifying-errors
 */

export enum PetraErrorCode {
  NO_ACCOUNTS = 4000,
  USER_REJECTION = 4001,
  UNAUTHORIZED = 4100,
}

export interface PetraError extends Error {
  code: PetraErrorCode;
}

export function isPetraError(error: any): error is PetraError {
  return error && typeof error.code === 'number' && error.code in PetraErrorCode;
}

export function getPetraErrorMessage(error: any): string {
  if (!isPetraError(error)) {
    return error?.message || 'Unknown error';
  }

  switch (error.code) {
    case PetraErrorCode.NO_ACCOUNTS:
      return 'No accounts found. Please create or import an account in Petra wallet.';
    case PetraErrorCode.USER_REJECTION:
      return 'Transaction rejected by user.';
    case PetraErrorCode.UNAUTHORIZED:
      return 'The requested method and/or account has not been authorized. Please connect your wallet first.';
    default:
      return error.message || 'Unknown Petra wallet error';
  }
}

export function handlePetraError(error: any, fallbackMessage?: string): string {
  if (isPetraError(error)) {
    return getPetraErrorMessage(error);
  }

  return fallbackMessage || error?.message || 'An error occurred with Petra wallet';
}

export class PetraWalletError extends Error {
  code: PetraErrorCode;

  constructor(code: PetraErrorCode, message?: string) {
    super(message || getPetraErrorMessage({ code } as PetraError));
    this.code = code;
    this.name = 'PetraWalletError';
  }
}
