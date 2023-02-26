import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPage } from 'next';
import BlocklyComponent, { Block } from '@components/terminus/Blockly';

import '@components/terminus/blocks/customblocks';

const TerminusIndexPage: NextPage = () => {
  return (
    <div>
      <BlocklyComponent initialXml={'<xml xmlns="http://www.w3.org/1999/xhtml"></xml>'}>
        <Block type='data_object_wrapper' />
        <Block type='data_object_wrapper_with_encryption' />
        <Block type='data_object_field_wrapper' />
        <Block type='data_object_field_type' />
        <Block type='data_object_field_default_types' />
        <Block type='data_object_field_encryption' />
        <Block type='data_object_field_mask' />
      </BlocklyComponent>
    </div>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default TerminusIndexPage;
