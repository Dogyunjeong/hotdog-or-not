import type { ComponentProps } from 'react';

import { type ButtonSize, type ButtonVariant, getButtonClassName } from './buttonClassName';

/** `ComponentProps<'button'>` includes `ref` (a regular prop in React 19). */
interface ButtonProps extends ComponentProps<'button'> {
  variant: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({
  variant,
  size,
  className = '',
  type = 'button',
  children,
  ...buttonProps
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={`${getButtonClassName({ variant, size })} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

export default Button;
