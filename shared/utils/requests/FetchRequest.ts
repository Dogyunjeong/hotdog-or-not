import type { SharedTypes } from '@/shared/types';

import ExpectedServerError, { type HttpStatusCode } from '../error/ExpectedServerError';
import NetworkError from '../error/NetworkError';

/** Per-request options; `signal` cancels the request (it then rejects like a network error). */
export interface RequestOptions {
  signal?: AbortSignal;
}

export interface IRequest {
  setBaseUrl: (baseUrl: string) => void;
  get: <T>(url: string, requestOptions?: RequestOptions) => Promise<{ data: T }>;
  post: <T>(url: string, body?: unknown, requestOptions?: RequestOptions) => Promise<{ data: T }>;
  delete: <T>(url: string, requestOptions?: RequestOptions) => Promise<{ data: T }>;
}

type HttpMethod = 'GET' | 'POST' | 'DELETE';

/**
 * Isomorphic JSON client built on `fetch` (browser, Node, Vercel functions).
 * - No response → `NetworkError`
 * - Non-2xx → `ExpectedServerError` carrying the API's `errorCode` and `message` (empty when the body isn't
 *   our JSON, e.g. a platform 502 page — callers then show their own friendly default)
 */
class FetchRequest implements IRequest {
  private _baseUrl: string;

  constructor({ baseUrl = '' }: { baseUrl?: string } = {}) {
    this._baseUrl = baseUrl;
  }

  private _buildUrl = (url: string) => {
    const path = url.startsWith('/') ? url.slice(1) : url;
    return `${this._baseUrl}/${path}`;
  };

  private _makeRequest = async <T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    requestOptions: RequestOptions = {},
  ): Promise<{ data: T }> => {
    const hasBody = body !== undefined;
    const response = await fetch(this._buildUrl(url), {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : {},
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: requestOptions.signal,
    }).catch((fetchError: unknown) => {
      throw new NetworkError(fetchError);
    });
    const responseData = await response.json().catch(() => undefined);

    if (!response.ok) {
      const apiErrorResponse = responseData as SharedTypes.ApiErrorResponse | undefined;
      throw new ExpectedServerError({
        errorCode: apiErrorResponse?.errorCode,
        message: apiErrorResponse?.message ?? '',
        httpStatusCode: response.status as HttpStatusCode,
        errorData: apiErrorResponse?.errorData,
      });
    }
    return { data: responseData as T };
  };

  public setBaseUrl = (baseUrl: string) => {
    this._baseUrl = baseUrl;
  };

  public get = <T>(url: string, requestOptions?: RequestOptions) => {
    return this._makeRequest<T>('GET', url, undefined, requestOptions);
  };

  public post = <T>(url: string, body?: unknown, requestOptions?: RequestOptions) => {
    return this._makeRequest<T>('POST', url, body, requestOptions);
  };

  public delete = <T>(url: string, requestOptions?: RequestOptions) => {
    return this._makeRequest<T>('DELETE', url, undefined, requestOptions);
  };
}

export default FetchRequest;
