'use client';

import TextButton from '@/components/primitives/TextButton';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

/** Opens Cookie settings from server-rendered content (e.g. the cookie policy page). */
const CookieSettingsButton = ({ label }: { label: string }) => {
  const { openCookieSettings } = useVisitorPrivacy();

  return (
    <TextButton variant="standalone" onClick={openCookieSettings}>
      {label}
    </TextButton>
  );
};

export default CookieSettingsButton;
