import { CopyToClipboardButton } from '@boxyhq/internal-ui';
import { useTranslation } from 'next-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const CodeSnippet = ({ token, baseUrl }: { token: string; baseUrl: string }) => {
  const { t } = useTranslation('common');

  const eventURL = `${baseUrl}/event`;
  const curlRequest = `curl -X POST -H "Content-Type: application/json" -H "Authorization: token=${token}" -d '{
  "action": "some.record.created",
  "group": {
    "id": "dev",
    "name": "dev"
  },
  "crud": "c",
  "created": "${new Date().toISOString()}",
  "source_ip": "127.0.0.1",
  "actor": {
    "id": "jackson@boxyhq.com",
    "name": "Jackson"
  },
  "target": {
    "id": "100",
    "name": "tasks",
    "type": "Tasks"
  }
}' ${eventURL}`;

  return (
    <>
      <div className='text-sm'>
        <div className='mb-5'>
          <div className='flex justify-between'>
            <label className='mb-2 block text-sm font-bold text-gray-900 dark:text-gray-300'>
              {t('send_event_to_url')}
            </label>
            <CopyToClipboardButton text={eventURL} />
          </div>

          <SyntaxHighlighter language='bash' style={materialOceanic} customStyle={{ borderRadius: '0.5em' }}>
            {eventURL}
          </SyntaxHighlighter>
        </div>

        <div>
          <div className='flex justify-between'>
            <label className='mb-2 block text-sm font-bold text-gray-900 dark:text-gray-300'>
              {t('curl_request')}
            </label>
            <CopyToClipboardButton text={curlRequest} />
          </div>

          <SyntaxHighlighter language='bash' style={materialOceanic} customStyle={{ borderRadius: '0.5em' }}>
            {curlRequest}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};

export default CodeSnippet;
