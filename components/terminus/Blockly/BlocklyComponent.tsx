import React, { useState } from 'react';
import styles from './BlocklyComponent.module.css';
import { useEffect, useRef, createRef } from 'react';
import { useTranslation } from 'next-i18next';

import Blockly from 'blockly/core';
import 'blockly/blocks';
import locale from 'blockly/msg/en';
Blockly.setLocale(locale);

import { ButtonPrimary } from '@components/ButtonPrimary';
import { generateModel } from '@components/terminus/blocks/generator';
import { errorToast, successToast } from '@components/Toaster';
import ConfirmationModal from '@components/ConfirmationModal';
import { ButtonBase } from '@components/ButtonBase';

function BlocklyComponent(props) {
  const { t } = useTranslation('common');

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

    const rsp = await fetch(getEndpoint(), requestOptions);

    if (rsp.ok) {
      successToast(t('model_published_successfully'));
      return;
    }

    errorToast(t('model_publish_failed'));
  };

  const [retrieveModalVisible, setRetrieveModalVisible] = useState(false);
  const toggleRetrieveConfirm = () => setRetrieveModalVisible(!retrieveModalVisible);

  const retrieveModel = async () => {
    const rsp = await fetch(getEndpoint());
    const response = await rsp.json();

    (primaryWorkspace.current! as any).clear();
    const textToDom = Blockly.utils.xml.textToDom(Buffer.from(response.data, 'base64').toString());
    Blockly.Xml.domToWorkspace(textToDom, primaryWorkspace.current! as any);

    setRetrieveModalVisible(false);
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
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(initialXml), primaryWorkspace.current as any);
    }

    retrieveModel();
  }, [primaryWorkspace, toolbox, blocklyDiv, props]);

  return (
    <div>
      <div className='mb-2" -mx-3 flex flex-wrap'>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <input
            ref={productField as any}
            type='text'
            className='input-bordered input h-10 w-full'
            id='productDemo'
            defaultValue='productDemo'
          />
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonPrimary onClick={uploadModel}>Publish Model</ButtonPrimary>
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonBase color='secondary' onClick={toggleRetrieveConfirm}>
            Retrieve Model
          </ButtonBase>
        </div>
      </div>

      <React.Fragment>
        <div ref={blocklyDiv as any} className={styles.blocklyDiv} />
        <div style={{ display: 'none' }} ref={toolbox as any}>
          {props.children}
        </div>
      </React.Fragment>

      <ConfirmationModal
        title={t('discard_and_retrieve_model')}
        description={t('discard_and_retrieve_model_desc')}
        actionButtonText={t('retrieve')}
        overrideDeleteButton={true}
        visible={retrieveModalVisible}
        onConfirm={retrieveModel}
        onCancel={toggleRetrieveConfirm}></ConfirmationModal>
    </div>
  );
}

export default BlocklyComponent;
