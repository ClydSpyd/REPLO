import { useQuery } from '@tanstack/react-query';
import { API } from '../api';

/** The authenticated user's saved routine templates. */
export const useMyProfileData = () => {
  return useQuery<UserProfile, Error>({
    queryKey: ['myProfileData'],
    queryFn: () => API.user.getMyProfileData(),
    retry: 1,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    enabled: Boolean(localStorage.getItem('access_token')),
  });
};
