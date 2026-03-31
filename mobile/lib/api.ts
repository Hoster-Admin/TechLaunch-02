import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { authEvents } from './authEvents';
import { storage } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://tlmena.com/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Token refresh state ────────────────────────────────────────────────────
// Tracks whether a refresh is in progress and queues callers that arrive
// while the refresh is pending so only one refresh request is ever made.

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(token: string) {
  refreshQueue.forEach((p) => p.resolve(token));
  refreshQueue = [];
}

function rejectQueue(err: unknown) {
  refreshQueue.forEach((p) => p.reject(err));
  refreshQueue = [];
}

async function tryRefresh(): Promise<string> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken?: string } }>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const { accessToken, refreshToken: newRefreshToken } = res.data.data;
  await storage.setToken(accessToken);
  if (newRefreshToken) {
    await storage.setRefreshToken(newRefreshToken);
  }
  return accessToken;
}

// ─── Request interceptor — attach Bearer token ──────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 with refresh ─────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const url = originalRequest.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Mark so we don't retry more than once per request
    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue this request until the refresh in progress finishes
      return new Promise<AxiosResponse>((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            } else {
              originalRequest.headers = { Authorization: `Bearer ${token}` };
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefresh();
      drainQueue(newToken);

      if (originalRequest.headers) {
        (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      } else {
        originalRequest.headers = { Authorization: `Bearer ${newToken}` };
      }
      return api(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      await storage.clear();
      authEvents.emitUnauthorized();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

type ApiErrorShape = {
  message?: string;
  error?: string;
  errors?:
    | string[]
    | Array<{ message?: string; msg?: string; field?: string }>
    | Record<string, string | string[]>;
};

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined;

    if (data?.errors) {
      const errs = data.errors;

      // Array of strings: ["Email already taken", "Name too short"]
      if (Array.isArray(errs) && errs.length > 0) {
        if (typeof errs[0] === 'string') {
          return (errs as string[]).join('\n');
        }
        // Array of objects: [{ field: "email", message: "..." }]
        const msgs = (errs as Array<{ message?: string; msg?: string }>)
          .map((e) => e.message ?? e.msg)
          .filter(Boolean) as string[];
        if (msgs.length > 0) return msgs.join('\n');
      }

      // Object map: { email: "already taken", name: ["too short"] }
      if (!Array.isArray(errs) && typeof errs === 'object') {
        const msgs = Object.entries(errs).map(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : val;
          return `${field}: ${msg}`;
        });
        if (msgs.length > 0) return msgs.join('\n');
      }
    }

    // Fall through to top-level message/error
    return data?.message ?? data?.error ?? error.message ?? 'Something went wrong';
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
