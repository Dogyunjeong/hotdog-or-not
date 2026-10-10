import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import { getTextLinkClassName } from '@/components/primitives/textLinkClassName';

import DetailSection from './DetailSection';

const OPEN_STREET_MAP_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

/** Privacy promise, plus the attribution OpenStreetMap's Nominatim usage policy requires. */
const PhotoLocationNotice = () => {
  const t = useTranslations('details');

  return (
    <div className="flex flex-col gap-1 text-xs text-foreground-muted">
      <p>{t('origin.locationPrivacy')}</p>
      <p>
        {t.rich('origin.locationCredit', {
          // External page in a new tab: a plain anchor, `TextLink` is for in-app navigation.
          link: (openStreetMapContributors) => (
            <a
              href={OPEN_STREET_MAP_COPYRIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={getTextLinkClassName('inline')}
            >
              {openStreetMapContributors}
            </a>
          ),
        })}
      </p>
    </div>
  );
};

interface HotdogOriginSectionProps {
  origin: HotdogTypes.HotdogOrigin;
}

const HotdogOriginSection = ({ origin }: HotdogOriginSectionProps) => {
  const t = useTranslations('details');

  return (
    <DetailSection title={t('origin.title')}>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {/* The model may not be able to place a style at all. */}
          {origin.placeName || t('origin.unknownPlace')}
        </p>
        <p className="text-sm text-foreground-muted">{t(`origin.source.${origin.source}`)}</p>
      </div>
      {origin.note && <p className="text-sm">{origin.note}</p>}
      {origin.source === 'photoLocation' && <PhotoLocationNotice />}
    </DetailSection>
  );
};

export default HotdogOriginSection;
