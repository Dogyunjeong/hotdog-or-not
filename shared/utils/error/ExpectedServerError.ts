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
 */
class ExpectedServerError extends Error {
  private _httpStatusCode: HttpStatusCode;
  private _errorData: unknown;

  public static HTTP_STATUS = HTTP_STATUS;

  constructor(errorMessage = '', httpStatusCode: HttpStatusCode = 400, errorData?: unknown) {
    super(errorMessage);
    this._httpStatusCode = httpStatusCode;
    this._errorData = errorData;
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
