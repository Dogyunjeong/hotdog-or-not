import { connection } from 'next/server';

import DataRetentionHandler from '@/server/api/dataRetention/DataRetention.handler';

const dataRetentionHandler = new DataRetentionHandler();

/** Called daily by Vercel Cron (`vercel.json`). */
export const GET = async (request: Request) => {
  // Never prerendered: it deletes data on each call.
  await connection();
  return dataRetentionHandler.runDataRetention(request);
};
