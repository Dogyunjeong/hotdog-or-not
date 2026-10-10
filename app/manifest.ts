import type { MetadataRoute } from 'next';

import { SITE_CANVAS_COLOR, SITE_DESCRIPTION, SITE_NAME } from './site.config';

const manifest = (): MetadataRoute.Manifest => {
  return {
    name: SITE_NAME,
    short_name: 'Hotdog?',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: SITE_CANVAS_COLOR.light,
    theme_color: SITE_CANVAS_COLOR.light,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
};

export default manifest;
