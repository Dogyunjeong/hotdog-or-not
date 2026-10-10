'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Keeps a native `<dialog>` in sync with `isOpen` via `showModal()` / `close()`,
 * which gives focus trapping, an inert background, the top layer and focus restore.
 *
 * The browser can close a dialog on its own while `isOpen` is still true: a repeated Esc or
 * Android back without user activation fires a non-cancelable `cancel` (Chrome, Firefox).
 * Then the dialog is reopened when `shouldReopenOnNativeClose` (e.g. an action is pending),
 * otherwise `onNativeClose` lets the parent resync its state.
 * A native listener is used on purpose: React would also deliver a nested dialog's
 * `close` to this dialog's `onClose`.
 */
export const useModalDialog = (
  isOpen: boolean,
  {
    onNativeClose,
    shouldReopenOnNativeClose = false,
  }: { onNativeClose?: () => void; shouldReopenOnNativeClose?: boolean } = {},
) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpenRef = useRef(isOpen);
  const onNativeCloseRef = useRef(onNativeClose);
  const shouldReopenOnNativeCloseRef = useRef(shouldReopenOnNativeClose);

  useEffect(() => {
    isOpenRef.current = isOpen;
    onNativeCloseRef.current = onNativeClose;
    shouldReopenOnNativeCloseRef.current = shouldReopenOnNativeClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleNativeClose = () => {
      if (!isOpenRef.current) {
        return;
      }

      if (shouldReopenOnNativeCloseRef.current) {
        dialog.showModal();
        return;
      }
      onNativeCloseRef.current?.();
    };

    dialog.addEventListener('close', handleNativeClose);
    return () => dialog.removeEventListener('close', handleNativeClose);
  }, []);

  // Layout effect: open/close in the same frame the content (un)mounts — no empty-shell flash.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return dialogRef;
};
