import { baseClient } from '.';
import type { RegisterInput } from '@replo/shared';

export const userMethods = {
  createUser: async (input: RegisterInput) => {
    const { data } = await baseClient.post<{
      accessToken: string;
      refreshToken: string;
    }>('/user/register', input);
    return data;
  },
  getMyProfileData: async () => {
    const { data } = await baseClient.get<UserProfile>('/user/me');
    return data;
  },
};
