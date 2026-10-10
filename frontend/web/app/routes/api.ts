import { createApiApp } from '@seamflow/api';

import type { Route } from './+types/api';

const apiApp = createApiApp();

export const loader = ({ request }: Route.LoaderArgs) => apiApp.fetch(request);

export const action = ({ request }: Route.ActionArgs) => apiApp.fetch(request);
