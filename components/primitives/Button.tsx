import type { ButtonHTMLAttributes } from 'react';

import { type ButtonSize, type ButtonVariant, getButtonClassName } from './buttonClassName';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
