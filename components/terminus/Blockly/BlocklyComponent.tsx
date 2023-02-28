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

  const getEndpoint = () => {
    // TODO robustify
    var p = 'productName';
    // if (document.getElementById('productName') != null) {
    //   p = document.getElementById('productName').value;
    // }

    return `/api/admin/terminus/models/${p}`;
  };

  const retrieveModel = async () => {
    const rsp = await fetch(getEndpoint());
    const response = await rsp.json();

    (primaryWorkspace.current! as any).clear();
    var textToDom = Blockly.Xml.textToDom(Buffer.from(response.data, 'base64').toString());
    Blockly.Xml.domToWorkspace(textToDom, primaryWorkspace.current! as any);
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

    retrieveModel();
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
