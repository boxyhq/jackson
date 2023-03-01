import React from 'react';
import styles from './BlocklyComponent.module.css';
import { useEffect, useRef, createRef } from 'react';

import Blockly from 'blockly/core';
import 'blockly/blocks';
import locale from 'blockly/msg/en';
Blockly.setLocale(locale);

import { ButtonPrimary } from '@components/ButtonPrimary';
import { generateModel } from '@components/terminus/blocks/generator';

function BlocklyComponent(props) {
  const blocklyDiv = useRef();
  const toolbox = useRef();
  const primaryWorkspace = useRef();
  const productField = createRef();

  const getEndpoint = () => {
    const product = (productField.current as any).value || 'productDemo';

    return `/api/admin/terminus/models/${product}`;
  };

  const modelToXML = () => {
    const xml = Blockly.Xml.workspaceToDom(primaryWorkspace.current as any);
    const domToPretty = Blockly.Xml.domToPrettyText(xml);
    return domToPretty;
  };

  const uploadModel = async () => {
    const domToPretty = modelToXML();
    const cueModel = generateModel(primaryWorkspace.current);

    const body = {
      cue_schema: Buffer.from(cueModel).toString('base64'),
      blockly_schema: Buffer.from(domToPretty).toString('base64'),
    };

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(body),
    };
    const response = await fetch(getEndpoint(), requestOptions);
  };

  const retrieveModel = async () => {
    const rsp = await fetch(getEndpoint());
    const response = await rsp.json();

    (primaryWorkspace.current! as any).clear();
    const textToDom = Blockly.Xml.textToDom(Buffer.from(response.data, 'base64').toString());
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
    <div>
      <div className='mb-2" -mx-3 flex flex-wrap'>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonPrimary onClick={uploadModel}>Publish Model</ButtonPrimary>
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonPrimary onClick={retrieveModel}>Retrieve Model</ButtonPrimary>
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <input
            ref={productField as any}
            type='text'
            className='input-bordered input h-10 w-full'
            id='productDemo'
            defaultValue='productDemo'
          />
        </div>
      </div>

      <React.Fragment>
        <div ref={blocklyDiv as any} className={styles.blocklyDiv} />
        <div style={{ display: 'none' }} ref={toolbox as any}>
          {props.children}
        </div>
      </React.Fragment>
    </div>
  );
}

export default BlocklyComponent;
