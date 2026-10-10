'use client';

import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

import CookieConsentNotice from '@/components/CookieConsent/CookieConsentNotice';
import { showCookieConsentPreferences } from '@/components/CookieConsent/historyCookieConsent';
import StatusToast from '@/components/primitives/StatusToast';
import { useHistoryConsent } from '@/hooks/useHistoryConsent';
import { VisitorPrivacyContext, type VisitorPrivacyContextValue } from '@/hooks/useVisitorPrivacy';
import DeleteAllDataDialog from './DeleteAllDataDialog';
import HistoryRevokeDialog from './HistoryRevokeDialog';

const ALL_DATA_ERASED_NOTICE = 'All gone. Your photos and verdicts were deleted.';
const GUEST_DATA_ERASED_NOTICE = 'Done. Nothing saved in this browser remains.';
const HISTORY_REVOKED_NOTICE = 'History is off and your data was erased.';
const HISTORY_KEPT_NOTICE = 'History stays on.';

/**
 * After an erase the page content resets, so focus goes to the page's h1 (tabIndex -1 on the
 * home and cookie policy pages). The h1 sits outside the workspace that remounts, so it keeps focus.
 */
const focusPageHeading = () => {
  document.querySelector<HTMLElement>('main h1')?.focus();
};

interface StatusNotice {
  message: string;
  /** Restarts the toast even when the same message is shown twice in a row. */
  noticeId: number;
}

/**
 * App-wide privacy state: cookie consent (banner and Cookie settings), turning history on
 * and off, "Delete my data", and one status toast. Read it with `useVisitorPrivacy()`.
 */
const VisitorPrivacyProvider = ({ children }: { children: ReactNode }) => {
  const [statusNotice, setStatusNotice] = useState<StatusNotice>();
  const [dataResetCount, setDataResetCount] = useState(0);
  const [isDeleteAllDataDialogOpen, setIsDeleteAllDataDialogOpen] = useState(false);

  const showNotice = useCallback((message: string) => {
    setStatusNotice((previousStatusNotice) => ({
      message,
      noticeId: (previousStatusNotice?.noticeId ?? 0) + 1,
    }));
  }, []);

  const dismissNotice = useCallback(() => {
    setStatusNotice(undefined);
  }, []);

  const {
    historyConsentStatus,
    isEnableHistoryFailed,
    isHistoryRevokePending,
    enableHistory,
    handleSavedDecisionRead,
    handleBannerAnswered,
    handleHistoryConsentChanged,
    completeHistoryRevoke,
    cancelHistoryRevoke,
  } = useHistoryConsent({ showNotice });
  // While history is starting a session may already exist; every other status means a guest
  // (or the banner still open): they get the guest wording.
  const isHistoryDataSaved =
    historyConsentStatus === 'enabled' || historyConsentStatus === 'enabling';

  const openDeleteAllData = useCallback(() => {
    setIsDeleteAllDataDialogOpen(true);
  }, []);

  const closeDeleteAllData = () => {
    setIsDeleteAllDataDialogOpen(false);
  };

  /**
   * Closes the dialog first and commits it synchronously: a sync commit also runs its effects,
   * so the native `close()` has already restored focus to the trigger. Then focus moves to the
   * page h1 (nothing can undo it now) and the reset starts.
   */
  const closeDialogThenResetVisitorData = ({
    closeDialog,
    erasedNotice,
  }: {
    closeDialog: () => void;
    erasedNotice: string;
  }) => {
    flushSync(closeDialog);
    focusPageHeading();
    setDataResetCount((previousDataResetCount) => previousDataResetCount + 1);
    showNotice(erasedNotice);
  };

  // Consent is unchanged: with history on, the next request starts a fresh, empty session.
  const handleAllDataErased = () => {
    closeDialogThenResetVisitorData({
      closeDialog: closeDeleteAllData,
      erasedNotice: isHistoryDataSaved ? ALL_DATA_ERASED_NOTICE : GUEST_DATA_ERASED_NOTICE,
    });
  };

  const handleHistoryRevokeErased = () => {
    closeDialogThenResetVisitorData({
      closeDialog: completeHistoryRevoke,
      erasedNotice: HISTORY_REVOKED_NOTICE,
    });
  };

  const handleKeepHistory = () => {
    cancelHistoryRevoke();
    showNotice(HISTORY_KEPT_NOTICE);
  };

  const visitorPrivacyContextValue = useMemo<VisitorPrivacyContextValue>(
    () => ({
      historyConsentStatus,
      isEnableHistoryFailed,
      dataResetCount,
      enableHistory,
      openCookieSettings: showCookieConsentPreferences,
      openDeleteAllData,
      showNotice,
    }),
    [
      historyConsentStatus,
      isEnableHistoryFailed,
      dataResetCount,
      enableHistory,
      openDeleteAllData,
      showNotice,
    ],
  );

  return (
    <VisitorPrivacyContext value={visitorPrivacyContextValue}>
      {children}
      <CookieConsentNotice
        onSavedDecisionRead={handleSavedDecisionRead}
        onBannerAnswered={handleBannerAnswered}
        onHistoryConsentChanged={handleHistoryConsentChanged}
      />
      <DeleteAllDataDialog
        isOpen={isDeleteAllDataDialogOpen}
        isHistoryEnabled={isHistoryDataSaved}
        onErased={handleAllDataErased}
        onClose={closeDeleteAllData}
      />
      <HistoryRevokeDialog
        isOpen={isHistoryRevokePending}
        onErased={handleHistoryRevokeErased}
        onKeepHistory={handleKeepHistory}
      />
      {/*
        Always mounted, so screen readers reliably announce what's put in it (a live region that
        mounts already filled is often skipped). The visual toast below is not a live region.
        A new span per notice makes a repeated message count as new.
      */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusNotice && <span key={statusNotice.noticeId}>{statusNotice.message}</span>}
      </div>
      {statusNotice && (
        <StatusToast
          key={statusNotice.noticeId}
          message={statusNotice.message}
          onDismiss={dismissNotice}
        />
      )}
    </VisitorPrivacyContext>
  );
};

export default VisitorPrivacyProvider;
