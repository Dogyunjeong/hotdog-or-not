import type { SharedTypes } from '@/shared/types';

import { API_ERROR_FALLBACK_MESSAGE } from './apiErrorFallbackMessage';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Error we expect and want to surface to the client as-is (validation, not found, ...).
 * Anything else is treated as an unexpected 500.
 * `errorCode` is what the UI translates; `message` stays an English fallback (defaults to the
 * code's fallback text).
 */
class ExpectedServerError extends Error {
  private _httpStatusCode: HttpStatusCode;
  private _errorData: unknown;
  private _errorCode?: SharedTypes.ApiErrorCode;

  public static HTTP_STATUS = HTTP_STATUS;

  constructor({
    errorCode,
    message = errorCode ? API_ERROR_FALLBACK_MESSAGE[errorCode] : '',
    httpStatusCode = HTTP_STATUS.BAD_REQUEST,
    errorData,
  }: {
    errorCode?: SharedTypes.ApiErrorCode;
    message?: string;
    httpStatusCode?: HttpStatusCode;
    errorData?: unknown;
  } = {}) {
    super(message);
    this._errorCode = errorCode;
    this._httpStatusCode = httpStatusCode;
    this._errorData = errorData;
  }

  public get errorCode(): SharedTypes.ApiErrorCode | undefined {
    return this._errorCode;
  }

  public get httpStatusCode(): HttpStatusCode {
    return this._httpStatusCode;
  }

  public get errorData(): unknown {
    return this._errorData;
  }
}

export default ExpectedServerError;
export { HTTP_STATUS, type HttpStatusCode };
