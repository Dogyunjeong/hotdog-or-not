import type { ReactNode } from 'react';

interface InlineAlertProps {
  message: string;
  action?: ReactNode;
  /**
   * `role="alert"` announces the message immediately. Pass `false` when the alert renders
   * inside an existing live region, so screen readers don't announce it twice.
   */
  isLiveRegion?: boolean;
}

const InlineAlert = ({ message, action, isLiveRegion = true }: InlineAlertProps) => {
  return (
    <div
      role={isLiveRegion ? 'alert' : undefined}
      className="flex flex-col items-start gap-3 rounded-card border border-danger-border bg-danger-soft p-4 text-danger"
    >
      <p>{message}</p>
      {action}
    </div>
  );
};

export default InlineAlert;
