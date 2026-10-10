import type { Metadata } from 'next';

import Card from '@/components/primitives/Card';
import PageContainer from '@/components/primitives/PageContainer';
import TextLink from '@/components/primitives/TextLink';

export const metadata: Metadata = {
  title: 'Cookie policy · Hotdog or Not Hotdog',
};

const COOKIE_DESCRIPTION_LIST = [
  'hotdog_or_not_visitor_session — keeps your history in this browser. Essential. Lasts 1 year.',
  "cc_cookie — remembers that you've seen our cookie notice. Essential. Lasts about 6 months.",
  "We don't use cookies for tracking or advertising.",
];

// TODO: Replace with the full cookie and privacy policy once its content is written.
const CookiePolicyPage = () => {
  return (
    <PageContainer>
      <TextLink variant="standalone" href="/" className="self-start text-sm">
        ← Back to Hotdog or Not Hotdog
      </TextLink>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cookie policy</h1>
        <p className="text-foreground-muted">
          We&apos;re still writing our full cookie policy. Here&apos;s the short version for now.
        </p>
      </header>
      <Card as="section">
        <ul className="list-disc space-y-2 pl-5">
          {COOKIE_DESCRIPTION_LIST.map((cookieDescription) => (
            <li key={cookieDescription}>{cookieDescription}</li>
          ))}
        </ul>
      </Card>
      <p className="text-sm text-foreground-muted">
        This page will be updated with our full policy soon.
      </p>
    </PageContainer>
  );
};

export default CookiePolicyPage;
