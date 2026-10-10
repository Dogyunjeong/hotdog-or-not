'use client';

import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
  useRef,
} from 'react';

import { useModalDialog } from './useModalDialog';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Id of the heading inside `children` that names the drawer. */
  labelledById: string;
  header: ReactNode;
  children: ReactNode;
}

/**
 * Modal side sheet (native `<dialog>`): full-screen below `sm`, a right-hand sheet above.
 * Esc and backdrop clicks close it.
 */
const Drawer = ({ isOpen, onClose, labelledById, header, children }: DrawerProps) => {
  const drawerRef = useModalDialog(isOpen, { onNativeClose: onClose });

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // React also delivers a nested dialog's `cancel` here (e.g. Esc in a confirm dialog
    // opened from the drawer); only Esc on the drawer itself closes it.
    if (event.target !== event.currentTarget) {
      return;
    }

    // The parent owns `isOpen`.
    event.preventDefault();
    onClose();
  };

  // A press that starts inside the content and ends on the backdrop (e.g. selecting text)
  // still fires a click on the <dialog>; only a press that STARTED on the backdrop closes it.
  const isBackdropPressRef = useRef(false);

  const handleBackdropPointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    isBackdropPressRef.current = event.target === event.currentTarget;
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // Clicks on the backdrop target the <dialog> itself, never its content.
    if (event.target !== event.currentTarget || !isBackdropPressRef.current) {
      return;
    }
    onClose();
  };

  return (
    <dialog
      ref={drawerRef}
      aria-labelledby={labelledById}
      onCancel={handleCancel}
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-foreground shadow-overlay backdrop:bg-overlay-scrim motion-safe:animate-drawer-enter motion-reduce:animate-status-enter sm:ml-auto sm:w-drawer sm:max-w-[calc(100%-3rem)] sm:rounded-l-card"
    >
      {isOpen && (
        <div className="flex h-full flex-col">
          <div className="sticky top-0 border-b border-border bg-surface px-4 py-2">{header}</div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
};

export default Drawer;
