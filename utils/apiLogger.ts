import { APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiLogEntry {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  requestBody?: unknown;
  responseBody?: unknown;
}

const LOGGED_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);

/**
 * Wraps an APIRequestContext so every call is reported to `onRequest`. Step
 * definitions keep calling `apiRequest.post(...)` as before; logging happens
 * underneath, which is why no step has to remember to log.
 */
export function withRequestLogging(
  context: APIRequestContext,
  onRequest: (entry: ApiLogEntry) => void,
): APIRequestContext {
  return new Proxy(context, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      if (typeof property !== 'string' || !LOGGED_METHODS.has(property)) return value.bind(target);

      return async (url: string, options?: { data?: unknown }) => {
        const startedAt = Date.now();
        const response: APIResponse = await value.call(target, url, options);

        onRequest({
          method: property,
          url: response.url(),
          status: response.status(),
          durationMs: Date.now() - startedAt,
          requestBody: options?.data,
          responseBody: response.status() === 204 ? undefined : await response.json().catch(() => undefined),
        });

        return response;
      };
    },
  });
}
