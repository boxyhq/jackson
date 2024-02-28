import useSWR from 'swr';
import { fetcher } from '../utils';

// TODO:
// Add types to response

export const useDirectory = (getDirectoryUrl: string) => {
  const { data, error, isLoading } = useSWR(getDirectoryUrl, fetcher);

  return {
    directory: data?.data,
    isLoadingDirectory: isLoading,
    directoryError: error,
  };
};
