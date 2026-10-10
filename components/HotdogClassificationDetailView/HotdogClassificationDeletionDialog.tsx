'use client';

import { useTranslations } from 'next-intl';

import type { HotdogClassificationDeletionState } from '@/hooks/useHotdogClassificationDeletion';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';

interface HotdogClassificationDeletionDialogProps {
  deletionState: HotdogClassificationDeletionState;
  onConfirm: () => void;
  onCancel: () => void;
}

const HotdogClassificationDeletionDialog = ({
  deletionState,
  onConfirm,
  onCancel,
}: HotdogClassificationDeletionDialogProps) => {
  const t = useTranslations('detailView.deletionDialog');

  return (
    <ConfirmDialog
      isOpen={deletionState.status !== 'idle'}
      title={t('title')}
      description={<p>{t('description')}</p>}
      confirmLabel={t('confirm')}
      pendingConfirmLabel={t('pendingConfirm')}
      cancelLabel={t('cancel')}
      isPending={deletionState.status === 'deleting'}
      errorMessage={deletionState.status === 'failed' ? t('error') : undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default HotdogClassificationDeletionDialog;
