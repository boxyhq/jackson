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
  let primaryWorkspace = useRef();

  const generateCode = () => {
    var code = javascriptGenerator.workspaceToCode(primaryWorkspace.current);
    console.log(code);
  };

  useEffect(() => {
    if (primaryWorkspace.current) {
      return;
    }

    const { initialXml, children, ...rest } = props;
    primaryWorkspace.current = Blockly.inject(blocklyDiv.current, {
      toolbox: toolbox.current,
      readOnly: false,
      trashcan: true,
      media: '/terminus/',
      renderer: 'minimalist', // geras zelos thrasos minimalist
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      sounds: false,
      ...rest,
    });

    if (initialXml) {
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialXml), primaryWorkspace.current);
    }
  }, [primaryWorkspace, toolbox, blocklyDiv, props]);

  return (
    <React.Fragment>
      {/* <button onClick={generateCode}>Convert</button> */}
      <div ref={blocklyDiv} className={styles.blocklyDiv} />
      <div style={{ display: 'none' }} ref={toolbox}>
        {props.children}
      </div>
    </React.Fragment>
  );
}

export default BlocklyComponent;
