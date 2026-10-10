import type { SharedTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';

/**
 * Expected errors keep their status and message; anything else is logged and
 * hidden behind `defaultMessage` with a 500.
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
      errorData: error.errorData,
    };
    return Response.json(expectedErrorResponse, { status: error.httpStatusCode });
  }

  console.error(error);
  const unexpectedErrorResponse: SharedTypes.ApiErrorResponse = { message: defaultMessage };
  return Response.json(unexpectedErrorResponse, { status: 500 });
};
