import type { HotdogTypes } from '@/shared/types';

import { getTextLinkClassName } from '@/components/primitives/textLinkClassName';

import DetailSection from './DetailSection';

const HOTDOG_ORIGIN_SOURCE_LABEL: Record<HotdogTypes.HotdogOriginSource, string> = {
  photoLocation: "From your photo's location",
  styleGuess: 'Guessed from the style',
};

/** The model may not be able to place a style at all. */
const UNKNOWN_PLACE_NAME = 'Somewhere delicious';

const OPEN_STREET_MAP_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

/** Privacy promise, plus the attribution OpenStreetMap's Nominatim usage policy requires. */
const PhotoLocationNotice = () => {
  return (
    <div className="flex flex-col gap-1 text-xs text-foreground-muted">
      <p>We only keep the city or region — never the exact spot.</p>
      <p>
        Location data ©{' '}
        {/* External page in a new tab: a plain anchor, `TextLink` is for in-app navigation. */}
        <a
          href={OPEN_STREET_MAP_COPYRIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={getTextLinkClassName('inline')}
        >
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
};

interface HotdogOriginSectionProps {
  origin: HotdogTypes.HotdogOrigin;
}

const HotdogOriginSection = ({ origin }: HotdogOriginSectionProps) => {
  return (
    <DetailSection title="Where it's from">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{origin.placeName || UNKNOWN_PLACE_NAME}</p>
        <p className="text-sm text-foreground-muted">{HOTDOG_ORIGIN_SOURCE_LABEL[origin.source]}</p>
      </div>
      {origin.note && <p className="text-sm">{origin.note}</p>}
      {origin.source === 'photoLocation' && <PhotoLocationNotice />}
    </DetailSection>
  );
};

export default HotdogOriginSection;
