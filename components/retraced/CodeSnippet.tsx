import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const CodeSnippet = ({ token, baseUrl }: { token: string; baseUrl: string }) => {
  return (
    <>
      <p className='text-sm font-bold'>Send your first event to Retraced.</p>
      <div className='text-sm'>
        <SyntaxHighlighter language='bash' style={materialOceanic}>
          {`curl -X POST -H "Content-Type: application/json" -H "Authorization: token=${token}" -d '{
  "action": "some.record.created",
  "teamId": "boxyhq",
  "group": {
    "id": "boxyhq",
    "name": "BoxyHQ"
  },
  "crud": "c",
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
}' ${baseUrl}/event`}
        </SyntaxHighlighter>
      </div>
    </>
  );
};

export default CodeSnippet;
