import type { SharedTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';
import type { Context } from 'hono';

export const handleError = ({
  c,
  error,
  defaultMessage,
}: {
  c: Context;
  error: unknown;
  defaultMessage: string;
}) => {
  if (error instanceof ExpectedServerError) {
    const expectedErrorResponse: SharedTypes.ApiErrorResponse = {
      message: error.message || defaultMessage,
      errorData: error.errorData,
    };
    return c.json(expectedErrorResponse, error.httpStatusCode);
  }

  console.error(`[${c.req.method} ${c.req.path}]`, error);
  const unexpectedErrorResponse: SharedTypes.ApiErrorResponse = { message: defaultMessage };
  return c.json(unexpectedErrorResponse, 500);
};
