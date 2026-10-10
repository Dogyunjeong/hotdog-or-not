import 'server-only';

import type { SharedTypes } from '@/shared/types';
import { ExpectedServerError } from '@/shared/utils/error';

/**
 * What an unexpected error may contribute to logs: its type and machine code only.
 * Messages and details from SDKs (Postgres, Storage, OpenAI) can echo session ids,
 * storage paths or request data, so they are never logged.
 */
const toLoggableError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }

  const errorCode = (error as { code?: unknown }).code;
  const errorStatus = (error as { status?: unknown }).status;
  return {
    name: error.name,
    ...(typeof errorCode === 'string' || typeof errorCode === 'number' ? { code: errorCode } : {}),
    ...(typeof errorStatus === 'number' ? { status: errorStatus } : {}),
  };
};

/**
 * Expected errors keep their status and message; anything else is logged (type/code only)
 * and hidden behind `defaultMessage` with a 500.
 */
export const handleError = ({
  error,
  defaultMessage,
}: {
  error: unknown;
  defaultMessage: string;
}): Response => {
  if (error instanceof ExpectedServerError) {
    const expectedErrorResponse: SharedTypes.ApiErrorResponse = {
      message: error.message || defaultMessage,
      errorCode: error.errorCode,
      errorData: error.errorData,
    };
    return Response.json(expectedErrorResponse, { status: error.httpStatusCode });
  }

  console.error('Unexpected API error', toLoggableError(error));
  const unexpectedErrorResponse: SharedTypes.ApiErrorResponse = { message: defaultMessage };
  return Response.json(unexpectedErrorResponse, { status: 500 });
};
