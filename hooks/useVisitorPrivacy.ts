'use client';

import { createContext, useContext } from 'react';

/**
 * - `undecided`: the cookie banner hasn't been answered yet (or isn't read yet)
 * - `enabling`: history was just accepted; the session is being started
 * - `enabled`: history consent — results are saved
 * - `disabled`: guest mode — nothing is saved
 *
 * While a "turn off history" confirmation is open the status stays `enabled`
 * (the data still exists) until the visitor confirms.
 */
export type HistoryConsentStatus = 'undecided' | 'enabling' | 'enabled' | 'disabled';

export interface VisitorPrivacyContextValue {
  historyConsentStatus: HistoryConsentStatus;
  /** Turning history on failed (session couldn't be started); `enableHistory` retries. */
  isEnableHistoryFailed: boolean;
  /** Bumped after the visitor's data is erased; key client state on it to reset. */
  dataResetCount: number;
  /** Accepts the `history` cookie category and starts the session. */
  enableHistory: () => void;
  openCookieSettings: () => void;
  openDeleteAllData: () => void;
  /** Shows a short status toast. */
  showNotice: (message: string) => void;
}

/** Provided by `components/VisitorPrivacy/VisitorPrivacyProvider.tsx` in the root layout. */
export const VisitorPrivacyContext = createContext<VisitorPrivacyContextValue | undefined>(
  undefined,
);

export const useVisitorPrivacy = (): VisitorPrivacyContextValue => {
  const visitorPrivacyContextValue = useContext(VisitorPrivacyContext);

  if (!visitorPrivacyContextValue) {
    throw new Error('useVisitorPrivacy must be used inside VisitorPrivacyProvider');
  }
  return visitorPrivacyContextValue;
};
