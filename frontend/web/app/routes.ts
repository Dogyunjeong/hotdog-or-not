import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  // Every `/api/*` request is served by the Hono app in `apps/api`.
  route('api/*', 'routes/api.ts'),
] satisfies RouteConfig;
