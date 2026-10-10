import { connection } from 'next/server';

import DataDeletionHandler from '@/server/api/dataDeletion/DataDeletion.handler';
import VisitorSessionHandler from '@/server/api/visitorSession/VisitorSession.handler';

const visitorSessionHandler = new VisitorSessionHandler();
const dataDeletionHandler = new DataDeletionHandler();

export const GET = async (request: Request) => {
  // Per-visitor data: opt out of prerendering before the handler reads cookies.
  await connection();
  return visitorSessionHandler.getCurrentVisitorSession(request);
};

export const DELETE = (request: Request) => dataDeletionHandler.eraseVisitorData(request);
