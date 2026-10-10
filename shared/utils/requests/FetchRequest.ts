import type { SharedTypes } from '@/shared/types';

import ExpectedServerError, { type HttpStatusCode } from '../error/ExpectedServerError';
import NetworkError from '../error/NetworkError';

export interface IRequest {
  setBaseUrl: (baseUrl: string) => void;
  get: <T>(url: string) => Promise<{ data: T }>;
  post: <T>(url: string, body?: unknown) => Promise<{ data: T }>;
}

type HttpMethod = 'GET' | 'POST';

/**
 * Isomorphic JSON client built on `fetch` (browser, Node, Vercel functions).
 * - No response → `NetworkError`
 * - Non-2xx → `ExpectedServerError` carrying the API's `message` (empty when the body isn't
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
  ): Promise<{ data: T }> => {
    const hasBody = body !== undefined;
    const response = await fetch(this._buildUrl(url), {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : {},
      body: hasBody ? JSON.stringify(body) : undefined,
    }).catch((fetchError: unknown) => {
      throw new NetworkError(fetchError);
    });
    const responseData = await response.json().catch(() => undefined);

    if (!response.ok) {
      const apiErrorResponse = responseData as SharedTypes.ApiErrorResponse | undefined;
      throw new ExpectedServerError(
        apiErrorResponse?.message ?? '',
        response.status as HttpStatusCode,
        apiErrorResponse?.errorData,
      );
    }
    return { data: responseData as T };
  };

  public setBaseUrl = (baseUrl: string) => {
    this._baseUrl = baseUrl;
  };

  public get = <T>(url: string) => {
    return this._makeRequest<T>('GET', url);
  };

  public post = <T>(url: string, body?: unknown) => {
    return this._makeRequest<T>('POST', url, body);
  };
}

export default FetchRequest;
