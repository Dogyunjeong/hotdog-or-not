'use client';

import { useTranslations } from 'next-intl';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';
import { useVisitorDataDeletion } from '@/hooks/useVisitorDataDeletion';

interface HistoryRevokeDialogProps {
  isOpen: boolean;
  onErased: () => void;
  /** Cancel (also after a failed erase): history stays on. */
  onKeepHistory: () => void;
}

/** Shown after history was turned off in Cookie settings: turning it off erases the data. */
const HistoryRevokeDialog = ({ isOpen, onErased, onKeepHistory }: HistoryRevokeDialogProps) => {
  const t = useTranslations('privacy.historyRevoke');
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
    onKeepHistory();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t('title')}
      description={<p>{t('description')}</p>}
      confirmLabel={t('confirmLabel')}
      pendingConfirmLabel={t('pendingConfirmLabel')}
      cancelLabel={t('cancelLabel')}
      isPending={isVisitorDataDeletionPending}
      errorMessage={isVisitorDataDeletionFailed ? t('error') : undefined}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default HistoryRevokeDialog;
