import { useQuery } from '@tanstack/react-query';
import { API } from '../api';

/** The authenticated user's saved routine templates. */
export const useMyRoutines = () => {
  return useQuery<Routine[], Error>({
    queryKey: ['myRoutines'],
    queryFn: () => API.routine.getMyRoutines(),
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: Boolean(localStorage.getItem('access_token')),
  });
};
