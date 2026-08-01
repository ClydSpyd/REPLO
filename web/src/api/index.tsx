import axios, { type AxiosError } from 'axios';
import { workoutMethods } from './workout';
import exerciseMethods from './exercises';
import { routineMethods } from './routine';

export const baseClient = axios.create({
  /**
   * Same-origin by default: in dev the Vite proxy forwards /api to Express,
   * and in production Express serves this bundle itself. Only set
   * VITE_API_BASE_URL when the API lives on a different host.
   */
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
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

baseClient.interceptors.response.use(
  (response) => response, // success: pass through untouched
  (error: AxiosError<{ error: string }>) => {
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
};
