import type { ButtonHTMLAttributes } from 'react';

import { getTextLinkClassName, type TextLinkVariant } from './textLinkClassName';

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TextLinkVariant;
}

/** An action that looks like a link (e.g. "Cookie settings" in the footer). */
const TextButton = ({
  variant = 'inline',
  className = '',
  type = 'button',
  ...buttonProps
}: TextButtonProps) => {
  return (
    <button
      type={type}
      className={`${getTextLinkClassName(variant)} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...buttonProps}
    />
  );
};

export default TextButton;
