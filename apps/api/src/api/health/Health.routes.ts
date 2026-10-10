import { Hono } from 'hono';

import type { ApiEnv } from '../../types/ApiEnv.type.ts';

const healthRoutes = new Hono<ApiEnv>();

healthRoutes.get('/', (c) => c.json({ status: 'ok' }));

export default healthRoutes;
