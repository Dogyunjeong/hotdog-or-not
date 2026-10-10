'use client';

import TextButton from '@/components/primitives/TextButton';
import TextLink from '@/components/primitives/TextLink';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

const FooterSeparator = ({ className = '' }: { className?: string }) => {
  return (
    <span aria-hidden className={className}>
      ·
    </span>
  );
};

/** Privacy controls on every page; "Delete my data" also explains itself for guests. */
const SiteFooter = () => {
  const { openCookieSettings, openDeleteAllData } = useVisitorPrivacy();

  return (
    <footer className="flex flex-col flex-wrap items-center justify-center gap-x-2 gap-y-0 px-4 py-6 text-sm text-foreground-muted sm:flex-row">
      <p>© 2026 Dogyun</p>
      {/* Mobile: the copyright sits on its own line, so no leading separator. */}
      <FooterSeparator className="hidden sm:inline" />
      <nav aria-label="Privacy" className="flex flex-wrap items-center justify-center gap-x-2">
        <TextLink variant="standalone" href="/cookie-policy">
          Cookie policy
        </TextLink>
        <FooterSeparator />
        <TextButton variant="standalone" onClick={openCookieSettings}>
          Cookie settings
        </TextButton>
        <FooterSeparator />
        <TextButton variant="standalone" onClick={openDeleteAllData}>
          Delete my data
        </TextButton>
      </nav>
    </footer>
  );
};

export default SiteFooter;
