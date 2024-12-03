import React from 'react';
import { Editor } from '@monaco-editor/react';

const CodeEditor = ({ code, setCode }: { code: string; setCode: (value: string | undefined) => void }) => {
  return (
    <div className='mb-5 border border-gray-300 rounded-md overflow-hidden'>
      <Editor
        height='40vh'
        language='r'
        theme='light'
        value={code}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'off',
          fontSize: 14,
          padding: { top: 10, bottom: 10 },
        }}
        onChange={setCode}
      />
    </div>
  );
};

export default CodeEditor;
