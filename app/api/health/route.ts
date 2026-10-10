import { connection } from 'next/server';

export const GET = async () => {
  // Answer at request time so the check reflects a live function, not a build artifact.
  await connection();
  return Response.json({ status: 'ok' });
};
