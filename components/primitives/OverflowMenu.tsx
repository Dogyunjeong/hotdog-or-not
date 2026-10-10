'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';

import Button from './Button';
import { FOCUS_RING_CLASS_NAME } from './focusRing';

export interface OverflowMenuItem {
  label: string;
  onSelect: () => void;
}

interface OverflowMenuProps {
  /** Accessible name of the trigger, e.g. "More history options". */
  triggerLabel: string;
  itemList: OverflowMenuItem[];
  /** Defaults to a horizontal ellipsis. */
  triggerIcon?: ReactNode;
}

/**
 * "More" icon button with a small menu (menu button pattern):
 * opening focuses the first item; ↑/↓/Home/End move; Esc closes and returns focus;
 * Tab, an outside click, or selecting an item closes it.
 */
const OverflowMenu = ({ triggerLabel, itemList, triggerIcon = '⋯' }: OverflowMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRefList = useRef<(HTMLButtonElement | null)[]>([]);

  const focusMenuItem = (menuItemIndex: number) => {
    const wrappedMenuItemIndex = (menuItemIndex + itemList.length) % itemList.length;
    menuItemRefList.current[wrappedMenuItemIndex]?.focus();
  };

  const closeMenu = ({ shouldFocusTrigger }: { shouldFocusTrigger: boolean }) => {
    setIsMenuOpen(false);

    if (shouldFocusTrigger) {
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    menuItemRefList.current[0]?.focus();

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && containerRef.current?.contains(event.target)) {
        return;
      }
      setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [isMenuOpen]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focusedMenuItemIndex = menuItemRefList.current.findIndex(
      (menuItem) => menuItem === document.activeElement,
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusMenuItem(focusedMenuItemIndex + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusMenuItem(focusedMenuItemIndex - 1);
        return;
      case 'Home':
        event.preventDefault();
        focusMenuItem(0);
        return;
      case 'End':
        event.preventDefault();
        focusMenuItem(itemList.length - 1);
        return;
      case 'Escape':
        event.preventDefault();
        // Keep Esc from also closing a surrounding panel/drawer.
        event.stopPropagation();
        closeMenu({ shouldFocusTrigger: true });
        return;
      case 'Tab':
        closeMenu({ shouldFocusTrigger: false });
        return;
      default:
        return;
    }
  };

  const handleMenuItemSelect = (menuItem: OverflowMenuItem) => {
    closeMenu({ shouldFocusTrigger: true });
    menuItem.onSelect();
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        variant="secondary"
        size="icon"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-controls={isMenuOpen ? menuId : undefined}
        onClick={() => setIsMenuOpen((isMenuOpenBefore) => !isMenuOpenBefore)}
      >
        <span aria-hidden>{triggerIcon}</span>
      </Button>
      {isMenuOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-2 flex min-w-48 flex-col rounded-card border border-border bg-surface p-1 text-foreground shadow-overlay motion-safe:animate-status-enter"
        >
          {itemList.map((menuItem, menuItemIndex) => (
            <button
              key={menuItem.label}
              ref={(menuItemElement) => {
                menuItemRefList.current[menuItemIndex] = menuItemElement;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => handleMenuItemSelect(menuItem)}
              className={`min-h-11 rounded-control px-3 text-left text-sm hover:bg-surface-muted ${FOCUS_RING_CLASS_NAME}`}
            >
              {menuItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverflowMenu;
