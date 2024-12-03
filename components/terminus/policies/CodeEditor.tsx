import React, { Suspense, useCallback } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';

const CodeEditor = ({ code, setCode }: { code: string; setCode: (value: string | undefined) => void }) => {
  const handleChange = useCallback((newValue) => {
    setCode(newValue);
  }, []);

  const editorOptions = {
    enableBasicAutocompletion: false,
    enableLiveAutocompletion: false,
    enableSnippets: false,
    enableMobileMenu: false,
    showLineNumbers: false,
    tabSize: 2,
  };

  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <AceEditor
        mode='python'
        theme='monokai'
        name='editor'
        value={code}
        onChange={handleChange}
        width='100%'
        height='30vh'
        editorProps={{ $blockScrolling: true }}
        setOptions={editorOptions}
      />
    </Suspense>
  );
};

export default CodeEditor;
