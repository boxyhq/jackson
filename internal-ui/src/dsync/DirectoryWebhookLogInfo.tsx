import useSWR from 'swr';
import type { WebhookEventLog } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import fetcher from '../utils/fetcher';
import { useDirectory } from '../hooks';
import { DirectoryTab } from '../dsync';
import { Loading, Error, PageHeader } from '../shared';

export const DirectoryWebhookLogInfo = ({
  urls,
}: {
  urls: { getEvent: string; getDirectory: string; tabBase: string };
}) => {
  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);
  const { data, isLoading, error } = useSWR<{ data: WebhookEventLog }>(urls.getEvent, fetcher);

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
      <DirectoryTab activeTab='events' baseUrl={urls.tabBase} />
      <div className='text-sm'>
        <SyntaxHighlighter language='json' style={materialOceanic}>
          {JSON.stringify(event, null, 2)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
