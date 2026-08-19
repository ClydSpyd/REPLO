import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { workoutMethods } from './workout';
import exerciseMethods from './exercises';
import { routineMethods } from './routine';
import { favoriteMethods } from './favorite';
import { userMethods } from './user';
import { userMetricsMethods } from './userMetrics';

export const baseClient = axios.create({
  /**
   * Same-origin by default: in dev the Vite proxy forwards /api to Express,
   * and in production Express serves this bundle itself. Only set
   */
  baseURL: '/api',
  // withCredentials: true,
});

baseClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// Requests we must never try to refresh: a 401 here means bad credentials
// (login/register) or a dead refresh token — not an expired access token.
const AUTH_ROUTES = ['/user/login', '/user/register', '/user/refresh'];
const isAuthRoute = (url?: string) =>
  !!url && AUTH_ROUTES.some((route) => url.includes(route));

// Single-flight guard: while a refresh is in progress every other 401 awaits
// this same promise instead of firing its own /user/refresh call.
let refreshPromise: Promise<string> | null = null;

// Exchanges the stored refresh token for a fresh access token. Uses a raw
// axios call so it skips these interceptors (no auth header, no recursion).
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post<{ accessToken: string }>(
    '/api/user/refresh',
    { refreshToken },
  );
  localStorage.setItem('access_token', data.accessToken);
  return data.accessToken;
}

// De-duplicates concurrent refreshes onto one promise.
function getRefreshedToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Refresh token is gone/invalid: drop the session and bounce to login,
// mirroring the manual logout in ViewHeader.
function endSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

baseClient.interceptors.response.use(
  (response) => response, // success: pass through untouched
  async (error: AxiosError<{ error: string }>) => {
    const originalRequest = error.config as RetriableRequest | undefined;

    // Access token likely expired: refresh once, then replay the request.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;
      try {
        const accessToken = await getRefreshedToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return baseClient(originalRequest); // retry the original call
      } catch {
        endSession();
        return Promise.reject(new Error('Session expired'));
      }
    }

    const message = error.response?.data?.error ?? error.message;
    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      message,
    });
    return Promise.reject(new Error(message)); // hand callers a clean Error
  },
);

export const API = {
  workout: workoutMethods,
  exercise: exerciseMethods,
  routine: routineMethods,
  favorite: favoriteMethods,
  user: userMethods,
  userMetrics: userMetricsMethods,
};
