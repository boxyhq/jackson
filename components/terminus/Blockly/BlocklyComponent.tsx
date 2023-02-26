import React from 'react';
import styles from './BlocklyComponent.module.css';
import { useEffect, useRef } from 'react';

import Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import locale from 'blockly/msg/en';
import 'blockly/blocks';

Blockly.setLocale(locale);

function BlocklyComponent(props) {
  const blocklyDiv = useRef();
  const toolbox = useRef();
  const primaryWorkspace = useRef();

  const generateCode = () => {
    const code = javascriptGenerator.workspaceToCode(primaryWorkspace.current);
    console.log(code);
  };

  useEffect(() => {
    if (primaryWorkspace.current) {
      return;
    }

    const { initialXml, children, ...rest } = props;
    primaryWorkspace.current = Blockly.inject(blocklyDiv.current as any, {
      toolbox: toolbox.current,
      readOnly: false,
      trashcan: true,
      media: '/terminus/',
      renderer: 'thrasos', // geras zelos thrasos minimalist
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      sounds: false,
      ...rest,
    }) as any;

    if (initialXml) {
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialXml), primaryWorkspace.current as any);
    }
  }, [primaryWorkspace, toolbox, blocklyDiv, props]);

  return (
    <React.Fragment>
      {/* <button onClick={generateCode}>Convert</button> */}
      <div ref={blocklyDiv as any} className={styles.blocklyDiv} />
      <div style={{ display: 'none' }} ref={toolbox as any}>
        {props.children}
      </div>
    </React.Fragment>
  );
}

export default BlocklyComponent;
