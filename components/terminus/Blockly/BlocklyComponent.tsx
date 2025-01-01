import React, { useState } from 'react';
import styles from './BlocklyComponent.module.css';
import { useEffect, useRef, createRef } from 'react';
import { useTranslation } from 'next-i18next';

import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { maskSetup } from '@components/terminus/blocks/customblocks';
import * as locale from 'blockly/msg/en';
Blockly.setLocale(locale as any);

import { generateModel } from '@components/terminus/blocks/generator';
import { errorToast, successToast } from '@components/Toaster';
import { ButtonBase, ButtonPrimary, ConfirmationModal } from '@boxyhq/internal-ui';

function BlocklyComponent(props) {
  const { t } = useTranslation('common');

  const blocklyDiv = useRef(null);
  const toolbox = useRef(null);
  const primaryWorkspace = useRef(null);
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
    const model = generateModel(primaryWorkspace.current, roles);

    const body = {
      model: model,
      blockly_model: domToPretty,
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
  const [roles, setRoles] = useState([]);
  const toggleRetrieveConfirm = () => setRetrieveModalVisible(!retrieveModalVisible);

  const retrieveModel = async () => {
    const rsp = await fetch(getEndpoint());
    const response = await rsp.json();
    if (!response.ok) {
      errorToast(t('model_retrieve_failed'));
      return;
    }

    (primaryWorkspace.current! as any).clear();
    const textToDom = Blockly.utils.xml.textToDom(response.data);
    Blockly.Xml.domToWorkspace(textToDom, primaryWorkspace.current! as any);

    setRetrieveModalVisible(false);
  };

  useEffect(() => {
    if (primaryWorkspace.current) {
      return;
    }

    (async function () {
      await getRolesAndSetupMasks();
      if (primaryWorkspace.current) {
        return;
      }

      const { initialXml, ...rest } = props;
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

      await retrieveModel();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryWorkspace, toolbox, blocklyDiv, roles, props]);

  return (
    <div>
      <div className='mb-2" -mx-3 flex flex-wrap'>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <input
            ref={productField as any}
            type='text'
            className='input-bordered input h-10 w-full'
            id='product'
            defaultValue='productDemo'
          />
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonPrimary onClick={uploadModel}>{t('publish_model')}</ButtonPrimary>
        </div>
        <div className='mb-6 w-full px-3 md:mb-0 md:w-1/3'>
          <ButtonBase color='secondary' onClick={toggleRetrieveConfirm}>
            {t('retrieve_model')}
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

  async function getRolesAndSetupMasks() {
    const rolesResp = await fetch(`/api/admin/terminus/roles`);
    const rolesList = (await rolesResp.json())?.data;
    maskSetup(rolesList);
    setRoles(rolesList);
  }
}

export default BlocklyComponent;
