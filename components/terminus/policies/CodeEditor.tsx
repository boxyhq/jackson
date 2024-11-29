import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/themes/prism.css';

const CodeEditor = ({ code, setCode }: { code: string; setCode: any }) => {
  return (
    <div className='mb-5 min-h-80'>
      <Editor
        id='acl-code-editor'
        value={code}
        onValueChange={(newValue) => {
          setCode(newValue);
        }}
        highlight={(code) => highlight(code, languages.javascript, 'js')}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: '14px',
          border: '1px solid #ddd',
          borderRadius: '0.375rem',
          width: '100%',
          minHeight: '300px',
          overflow: 'auto',
          transition: 'border-color 0.3s ease',
          boxSizing: 'border-box',
        }}
        required
      />
    </div>
  );
};

export default CodeEditor;
