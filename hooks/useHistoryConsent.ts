'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  acceptHistoryConsent,
  isHistoryConsentAccepted,
  rejectHistoryConsent,
  type HistoryConsentDecision,
} from '@/components/CookieConsent/historyCookieConsent';
import { visitorSessionController } from '@/controllers/apiControllers';
import type { HistoryConsentStatus } from '@/hooks/useVisitorPrivacy';

/** With history consent, the API starts the session and sets its cookie. */
const startHistorySession = async (): Promise<boolean> => {
  try {
    const { isHistoryEnabled } = await visitorSessionController.getCurrentVisitorSession();
    return isHistoryEnabled;
  } catch {
    return false;
  }
};

/**
 * History was turned off while its session was starting: that session (empty, but with a
 * cookie) must not stay behind. Nothing to tell the visitor, so a failure is ignored.
 */
const discardStaleHistorySession = (isHistorySessionStarted: boolean) => {
  if (!isHistorySessionStarted || isHistoryConsentAccepted()) {
    return;
  }
  visitorSessionController.eraseVisitorData().catch(() => undefined);
};

/**
 * The visitor's history consent, driven by the cookie consent library's events.
 * Turning history off only takes effect once the visitor confirms the erase
 * (`isHistoryRevokePending`); until then the status stays `enabled`.
 */
export const useHistoryConsent = ({ showNotice }: { showNotice: (message: string) => void }) => {
  const t = useTranslations('privacy.notices');
  const [historyConsentStatus, setHistoryConsentStatus] =
    useState<HistoryConsentStatus>('undecided');
  const [isEnableHistoryFailed, setIsEnableHistoryFailed] = useState(false);
  const [isHistoryRevokePending, setIsHistoryRevokePending] = useState(false);
  // A session start that resolves after a newer consent change must not apply.
  const latestHistorySessionStartIdRef = useRef(0);

  // Leaving the page with "Turn off history?" still open: the visitor never confirmed the erase,
  // so their data and session stay — put `history` back in the consent cookie to match.
  // If the page comes back from the back/forward cache with the prompt still open, take it out
  // again, so confirming afterwards can't leave history switched on.
  useEffect(() => {
    if (!isHistoryRevokePending) {
      return;
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }
      rejectHistoryConsent();
    };

    window.addEventListener('pagehide', acceptHistoryConsent);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pagehide', acceptHistoryConsent);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isHistoryRevokePending]);

  const enableHistorySession = useCallback(
    async ({ isEnabledNoticeShown }: { isEnabledNoticeShown: boolean }) => {
      latestHistorySessionStartIdRef.current += 1;
      const historySessionStartId = latestHistorySessionStartIdRef.current;
      setHistoryConsentStatus('enabling');
      setIsEnableHistoryFailed(false);

      const isHistorySessionStarted = await startHistorySession();

      if (historySessionStartId !== latestHistorySessionStartIdRef.current) {
        discardStaleHistorySession(isHistorySessionStarted);
        return;
      }

      if (!isHistorySessionStarted) {
        setHistoryConsentStatus('disabled');
        setIsEnableHistoryFailed(true);
        return;
      }
      setHistoryConsentStatus('enabled');

      if (isEnabledNoticeShown) {
        showNotice(t('historyEnabled'));
      }
    },
    [showNotice, t],
  );

  const disableHistory = () => {
    latestHistorySessionStartIdRef.current += 1;
    setHistoryConsentStatus('disabled');
    setIsEnableHistoryFailed(false);
  };

  /** A saved "accept" needs no request: `proxy.ts` already issued the cookie with the page. */
  const handleSavedDecisionRead = (historyConsentDecision: HistoryConsentDecision) => {
    switch (historyConsentDecision) {
      case 'accepted':
        setHistoryConsentStatus('enabled');
        return;
      case 'rejected':
        setHistoryConsentStatus('disabled');
        return;
    }
  };

  const handleBannerAnswered = (historyConsentDecision: HistoryConsentDecision) => {
    switch (historyConsentDecision) {
      case 'accepted':
        void enableHistorySession({ isEnabledNoticeShown: false });
        return;
      case 'rejected':
        disableHistory();
        return;
    }
  };

  const handleHistoryConsentChanged = (historyConsentDecision: HistoryConsentDecision) => {
    const isHistorySessionActive =
      historyConsentStatus === 'enabled' || historyConsentStatus === 'enabling';

    switch (historyConsentDecision) {
      case 'accepted':
        // Our own re-accept after "Keep history on" (or a repeat) changes nothing.
        if (isHistorySessionActive) {
          return;
        }
        void enableHistorySession({ isEnabledNoticeShown: true });
        return;
      case 'rejected':
        // Saved data still exists: ask before erasing it.
        if (historyConsentStatus === 'enabled') {
          setIsHistoryRevokePending(true);
          return;
        }
        disableHistory();
        return;
    }
  };

  /**
   * Accepting the category fires the library's change event, which starts the session;
   * when it's already accepted (a failed start), start the session again directly.
   */
  const enableHistory = useCallback(() => {
    if (historyConsentStatus === 'enabled' || historyConsentStatus === 'enabling') {
      return;
    }

    if (!isHistoryConsentAccepted()) {
      acceptHistoryConsent();
      return;
    }
    void enableHistorySession({ isEnabledNoticeShown: true });
  }, [historyConsentStatus, enableHistorySession]);

  /** The visitor confirmed and the data is erased. */
  const completeHistoryRevoke = () => {
    setIsHistoryRevokePending(false);
    disableHistory();

    // Defensive: the erase is done, so the consent cookie must not still say "history".
    if (isHistoryConsentAccepted()) {
      rejectHistoryConsent();
    }
  };

  /** "Keep history on": put the category back; the session and data were never touched. */
  const cancelHistoryRevoke = () => {
    setIsHistoryRevokePending(false);
    acceptHistoryConsent();
  };

  return {
    historyConsentStatus,
    isEnableHistoryFailed,
    isHistoryRevokePending,
    enableHistory,
    handleSavedDecisionRead,
    handleBannerAnswered,
    handleHistoryConsentChanged,
    completeHistoryRevoke,
    cancelHistoryRevoke,
  };
};
