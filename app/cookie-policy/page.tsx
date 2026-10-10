import type { Metadata } from 'next';

import Card from '@/components/primitives/Card';
import PageContainer from '@/components/primitives/PageContainer';
import { getTextLinkClassName } from '@/components/primitives/textLinkClassName';
import CookieSettingsButton from '@/components/VisitorPrivacy/CookieSettingsButton';

export const metadata: Metadata = {
  title: 'Cookie policy · Hotdog or Not Hotdog',
};

const COOKIE_CATEGORY_LIST = [
  {
    title: 'Essential — always on',
    cookieName: 'cc_cookie',
    description: 'Remembers your cookie choice. Lasts about 6 months.',
  },
  {
    title: 'History — only if you accept',
    cookieName: 'hotdog_or_not_visitor_session',
    description:
      'Keeps your photos and verdicts in this browser. Lasts 1 year. Turning it off erases your saved data.',
  },
];

const PRIVACY_NOTE_LIST = [
  'We remove location data from photos before saving them. If your photo has a location, we keep only the city or region, never the exact spot.',
  'Photos you check are sent to OpenAI to get the verdict.',
  'Photos you check are sent to OpenAI to get the verdict.',
  "To guess where a hotdog is from, we send the photo's approximate location (rounded to about 1 km) to OpenStreetMap's free geocoding service — only for photos that turn out to be hotdogs.",
  "We don't use cookies for tracking or advertising.",
  'You can delete everything anytime with “Delete my data”.',
];

// TODO: Replace with the full cookie and privacy policy once its content is written.
const CookiePolicyPage = () => {
  return (
    <PageContainer>
      {/*
        A full page load on purpose (not next/link): visitors arrive here from the cookie banner,
        and the home page must start its banner → onboarding sequence fresh (blocking banner).
      */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={`${getTextLinkClassName('standalone')} self-start text-sm`}>
        ← Back to Hotdog or Not Hotdog
      </a>
      <header className="space-y-2">
        {/* Focused after "Delete my data" (tabIndex -1), like the home page heading. */}
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
          Cookie policy
        </h1>
        <p className="text-foreground-muted">
          Here&apos;s the short version while we finish the full policy.
        </p>
      </header>
      {COOKIE_CATEGORY_LIST.map((cookieCategory) => (
        <Card key={cookieCategory.cookieName} as="section" className="space-y-2">
          <h2 className="font-semibold">{cookieCategory.title}</h2>
          <p>
            <code className="font-mono text-sm">{cookieCategory.cookieName}</code>
          </p>
          <p className="text-foreground-muted">{cookieCategory.description}</p>
        </Card>
      ))}
      <ul className="list-disc space-y-2 pl-5">
        {PRIVACY_NOTE_LIST.map((privacyNote) => (
          <li key={privacyNote}>{privacyNote}</li>
        ))}
      </ul>
      <p>
        <CookieSettingsButton label="Change cookie settings" />
      </p>
      <p className="text-sm text-foreground-muted">
        This page will be updated with our full policy soon.
      </p>
    </PageContainer>
  );
};

export default CookiePolicyPage;
