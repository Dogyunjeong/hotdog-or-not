import { connection } from 'next/server';

import VisitorSessionHandler from '@/server/api/visitorSession/VisitorSession.handler';

const visitorSessionHandler = new VisitorSessionHandler();

export const GET = async (request: Request) => {
  // Per-visitor data: opt out of prerendering before the handler reads cookies.
  await connection();
  return visitorSessionHandler.getCurrentVisitorSession(request);
};
