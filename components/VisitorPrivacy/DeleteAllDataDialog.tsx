'use client';

import { useTranslations } from 'next-intl';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';
import { useVisitorDataDeletion } from '@/hooks/useVisitorDataDeletion';

const ERASED_ITEM_KEY_LIST = ['erasedPhotos', 'erasedVerdicts', 'erasedSessionCookie'] as const;

interface DeleteAllDataDialogProps {
  isOpen: boolean;
  isHistoryEnabled: boolean;
  onErased: () => void;
  onClose: () => void;
}

const HistoryEnabledDeleteAllDataDescription = () => {
  const t = useTranslations('privacy.deleteAll');

  return (
    <>
      <p>{t('historyIntro')}</p>
      <ul className="list-disc space-y-1 pl-5">
        {ERASED_ITEM_KEY_LIST.map((erasedItemKey) => (
          <li key={erasedItemKey}>{t(erasedItemKey)}</li>
        ))}
      </ul>
      <p>{t('historyOutro')}</p>
    </>
  );
};

/**
 * Guests aren't saving anything now, but may still have data from before (e.g. history was
 * turned off without confirming the erase) — the same erase removes it, or does nothing.
 */
const GuestDeleteAllDataDescription = () => {
  const t = useTranslations('privacy.deleteAll');

  return <p>{t('guestDescription')}</p>;
};

/** "Delete my data" (footer and history panel). */
const DeleteAllDataDialog = ({
  isOpen,
  isHistoryEnabled,
  onErased,
  onClose,
}: DeleteAllDataDialogProps) => {
  const t = useTranslations('privacy.deleteAll');
  const {
    isVisitorDataDeletionPending,
    isVisitorDataDeletionFailed,
    eraseVisitorData,
    resetVisitorDataDeletion,
  } = useVisitorDataDeletion();

  const handleConfirm = async () => {
    const isErased = await eraseVisitorData();

    if (!isErased) {
      return;
    }
    onErased();
  };

  const handleCancel = () => {
    resetVisitorDataDeletion();
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t('title')}
      description={
        isHistoryEnabled ? (
          <HistoryEnabledDeleteAllDataDescription />
        ) : (
          <GuestDeleteAllDataDescription />
        )
      }
      confirmLabel={t('confirmLabel')}
      pendingConfirmLabel={t('pendingConfirmLabel')}
      // "Keep my data" would imply we hold data for a guest.
      cancelLabel={isHistoryEnabled ? t('keepLabel') : t('cancelLabel')}
      isPending={isVisitorDataDeletionPending}
      errorMessage={isVisitorDataDeletionFailed ? t('error') : undefined}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default DeleteAllDataDialog;
