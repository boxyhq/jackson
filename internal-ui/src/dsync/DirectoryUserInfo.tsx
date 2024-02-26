import useSWR from 'swr';
import type { User } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { fetcher } from '../utils';
import { useDirectory } from '../hooks';
import { DirectoryTab } from '../dsync';
import { Loading, Error, PageHeader } from '../shared';

export const DirectoryUserInfo = ({
  urls,
}: {
  urls: { getUser: string; getDirectory: string; tabBase: string };
}) => {
  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);
  const { data, isLoading, error } = useSWR<{ data: User }>(urls.getUser, fetcher);

  if (isLoading || isLoadingDirectory) {
    return <Loading />;
  }

  if (error || directoryError) {
    return <Error message={error.message || directoryError.message} />;
  }

  if (!data || !directory) {
    return null;
  }

  const user = data.data;

  return (
    <>
      <PageHeader title={directory.name} />
      <DirectoryTab activeTab='users' baseUrl={urls.tabBase} />
      <div className='text-sm'>
        <SyntaxHighlighter language='json' style={materialOceanic}>
          {JSON.stringify(user, null, 2)}
        </SyntaxHighlighter>
      </div>
    </>
  );
};
