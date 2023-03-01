import React from 'react';
import styles from './BlocklyComponent.module.css';
import { useEffect, useRef, createRef } from 'react';

import Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import locale from 'blockly/msg/en';
Blockly.setLocale(locale);

import { ButtonPrimary } from '@components/ButtonPrimary';
import { ObjectMap, CONST_OBJ_GLB_ENCR } from '@components/terminus/blocks/generator';

const IGNORE_FIELDS = [CONST_OBJ_GLB_ENCR];

// TODO this must come from CUE and the regexp are hacked here for generation
const simpleRegex = '^[a-zA-Z]+$';
const regexMap = {
  'defs.#Letters': simpleRegex,
  'defs.#LettersWithSpaces': simpleRegex,
  'defs.#Alphanumerical': simpleRegex,
  'defs.#AlphanumericalWithSpaces': simpleRegex,
  'defs.#AlphanumericalNotAccented': simpleRegex,
  'defs.#AlphanumericalNotAccentedWithSpaces': simpleRegex,
  'defs.#SimpleDateFormat': '^20[0-9]{2}-[0-1][1-2]-[0-2][1-8]$', // regex restricted.
};

function BlocklyComponent(props) {
  const blocklyDiv = useRef();
  const toolbox = useRef();
  const primaryWorkspace = useRef();
  const productField = createRef();

  const getEndpoint = () => {
    const product = (productField.current as any).value || 'productDemo';

    return `/api/admin/terminus/models/${product}`;
  };

  const generateModel = () => {
    ObjectMap.clear();
    // trigger the BLOCKLY processing which will run our custom code generation
    javascriptGenerator.workspaceToCode(primaryWorkspace.current);
    const ret = _generateCUEStructureAndJSONSchemas();

    // add specific BoxyHQ imports
    return `
    EncryptedDefinitions: ${JSON.stringify(ret[1])}
    ${ret[0]}
    `;
  };

  // Rudimentary way of generating a CUE file and a JSON model for synthetic data generation
  const _generateCUEStructureAndJSONSchemas = () => {
    let defs = ``;
    const encrObjects = [];
    for (const [key, value] of Object.entries(Object.fromEntries(ObjectMap))) {
      encrObjects.push(key as never);
      const valuesMap = Object.fromEntries(value as any);

      // DEFINITIONS
      let definitions = ``;
      for (const [field, values] of Object.entries(valuesMap)) {
        if (IGNORE_FIELDS.includes(field)) {
          continue;
        }
        definitions += `\n\t\t\t${field}: ${values[0]}`;

        let pattern = regexMap[values[0]];
        if (pattern == null) {
          pattern = '.*';
        }
      }

      // ENCRYPTION
      let encryption = ``;
      if (valuesMap[CONST_OBJ_GLB_ENCR] != null) {
        encryption += `${valuesMap[CONST_OBJ_GLB_ENCR]}`;
      } else {
        for (const [field, values] of Object.entries(valuesMap)) {
          encryption += `\n\t\t\t${field}: ${values[1]}`;
        }
        encryption = `{ ${encryption}
        }`;
      }

      // MASKS
      let masks = ``;
      for (const [field, values] of Object.entries(valuesMap)) {
        if (IGNORE_FIELDS.includes(field)) {
          continue;
        }
        masks += `\n\t\t\t${field}: ${values[2]}`;
      }
      const objectOutput = `\n#${key}: {
        #Definition: { ${definitions}
        }
        #Encryption: ${encryption}
        #Mask_admin: { ${masks}
        }
      }`;
      defs += objectOutput;
    }

    return [defs, encrObjects];
  };

  const modelToXML = () => {
    const xml = Blockly.Xml.workspaceToDom(primaryWorkspace.current as any);
    const domToPretty = Blockly.Xml.domToPrettyText(xml);
    return domToPretty;
  };

  const uploadModel = async () => {
    const domToPretty = modelToXML();
    const cueModel = generateModel();

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
