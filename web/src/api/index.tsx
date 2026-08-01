import axios, { type AxiosError } from 'axios';
import { workoutMethods } from './workout';
import exerciseMethods from './exercises';
import { routineMethods } from './routine';

export const baseClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
