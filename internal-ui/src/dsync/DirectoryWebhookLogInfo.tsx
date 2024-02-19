import useSWR from 'swr';
import fetcher from '../utils/fetcher';
import { DirectoryTab } from './DirectoryTab';
import { Loading, Error, PageHeader } from '../shared';
import type { WebhookEventLog } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useDirectory } from '../hooks';

export const DirectoryWebhookLogInfo = ({ urls }: { urls: { get: string; getDirectory: string } }) => {
  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);
  const { data, isLoading, error } = useSWR<{ data: WebhookEventLog }>(urls.get, fetcher);

  if (isLoading || isLoadingDirectory) {
    return <Loading />;
  }

  if (error || directoryError) {
    return <Error message={error.message || directoryError.message} />;
  }

  if (!data || !directory) {
    return null;
  }

  const event = data.data;

  return (
    <div className='py-2'>
      <PageHeader title={directory.name} />
      <DirectoryTab directoryId='hello' activeTab='events' />
      <div className='text-sm'>
        <SyntaxHighlighter language='json' style={materialOceanic}>
          {JSON.stringify(event, null, 2)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
