import type { SharedTypes } from '@seamflow/shared-types';

import ExpectedServerError, { type HttpStatusCode } from '../error/ExpectedServerError.ts';

export interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface IRequest {
  setBaseUrl: (baseUrl: string) => void;
  setAccessToken: (accessToken: string) => void;
  get: <T>(url: string, config?: RequestConfig) => Promise<{ data: T }>;
  delete: <T>(url: string, config?: RequestConfig) => Promise<{ data: T }>;
  post: <T>(url: string, body?: unknown, config?: RequestConfig) => Promise<{ data: T }>;
  put: <T>(url: string, body?: unknown, config?: RequestConfig) => Promise<{ data: T }>;
  patch: <T>(url: string, body?: unknown, config?: RequestConfig) => Promise<{ data: T }>;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Isomorphic HTTP client built on `fetch` (browser, Node, Vercel functions).
 */
class FetchRequest implements IRequest {
  private _baseUrl: string;
  private _accessToken?: string;

  constructor({ baseUrl = '' }: { baseUrl?: string } = {}) {
    this._baseUrl = baseUrl;
  }

  private _buildUrl = (url: string, params: RequestConfig['params'] = {}) => {
    const path = url.startsWith('/') ? url.slice(1) : url;
    const definedParamEntryList = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]);
    const queryString = new URLSearchParams(definedParamEntryList).toString();

    if (!queryString) {
      return `${this._baseUrl}/${path}`;
    }
    return `${this._baseUrl}/${path}?${queryString}`;
  };

  private _buildHeaders = (hasJsonBody: boolean, headers: RequestConfig['headers'] = {}) => {
    const authorizationHeader: Record<string, string> = this._accessToken
      ? { Authorization: `Bearer ${this._accessToken}` }
      : {};
    const contentTypeHeader: Record<string, string> = hasJsonBody
      ? { 'Content-Type': 'application/json' }
      : {};
    return { ...contentTypeHeader, ...authorizationHeader, ...headers };
  };

  /**
   * FormData is sent as-is so `fetch` sets the multipart boundary itself.
   * Everything else is JSON.
   */
  private _buildBody = (body: unknown): BodyInit | undefined => {
    if (body === undefined) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }
    return JSON.stringify(body);
  };

  private _makeRequest = async <T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<{ data: T }> => {
    const hasJsonBody = body !== undefined && !(body instanceof FormData);
    const response = await fetch(this._buildUrl(url, config.params), {
      method,
      headers: this._buildHeaders(hasJsonBody, config.headers),
      body: this._buildBody(body),
    });
    const responseData = await response.json().catch(() => undefined);

    if (!response.ok) {
      const apiErrorResponse = responseData as SharedTypes.ApiErrorResponse | undefined;
      throw new ExpectedServerError(
        apiErrorResponse?.message || response.statusText,
        response.status as HttpStatusCode,
        apiErrorResponse?.errorData,
      );
    }
    return { data: responseData as T };
  };

  public setBaseUrl = (baseUrl: string) => {
    this._baseUrl = baseUrl;
  };

  public setAccessToken = (accessToken: string) => {
    this._accessToken = accessToken;
  };

  public get = <T>(url: string, config?: RequestConfig) => {
    return this._makeRequest<T>('GET', url, undefined, config);
  };

  public delete = <T>(url: string, config?: RequestConfig) => {
    return this._makeRequest<T>('DELETE', url, undefined, config);
  };

  public post = <T>(url: string, body?: unknown, config?: RequestConfig) => {
    return this._makeRequest<T>('POST', url, body, config);
  };

  public put = <T>(url: string, body?: unknown, config?: RequestConfig) => {
    return this._makeRequest<T>('PUT', url, body, config);
  };

  public patch = <T>(url: string, body?: unknown, config?: RequestConfig) => {
    return this._makeRequest<T>('PATCH', url, body, config);
  };
}

export default FetchRequest;
