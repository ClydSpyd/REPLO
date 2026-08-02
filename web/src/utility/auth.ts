import type { LoginInput, RegisterInput } from '@replo/shared';
import { API, baseClient } from '../api';

type TokenPair = { accessToken: string; refreshToken: string };

function persistTokens({ accessToken, refreshToken }: TokenPair) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

// Utility to call login endpoint and handle tokens. Callers pre-validate `input`.
export async function loginUser(input: LoginInput): Promise<TokenPair> {
  const { data } = await baseClient.post<TokenPair>('/user/login', input);
  persistTokens(data);
  return data;
}

// Utility to call the register endpoint and handle tokens.
export async function registerUser(input: RegisterInput): Promise<TokenPair> {
  const data = await API.user.createUser(input);
  persistTokens(data);
  return data;
}
