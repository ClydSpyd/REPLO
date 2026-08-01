import { baseClient } from '../api';

// Utility to call login endpoint and handle tokens
export async function loginUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await baseClient.post('/user/login', {
    email,
    password,
  });
  const { accessToken, refreshToken } = data;
  // Save tokens to localStorage
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  return { accessToken, refreshToken };
}

// Utility to call the register endpoint and handle tokens
export async function registerUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await baseClient.post('/user/register', {
    email,
    password,
  });
  const { accessToken, refreshToken } = data;
  // Save tokens to localStorage
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  return { accessToken, refreshToken };
}
