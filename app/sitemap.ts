import type { MetadataRoute } from 'next';

import { SITE_URL } from './site.config';

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/cookie-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ];
};

export default sitemap;
