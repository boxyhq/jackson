import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPage } from 'next';
import BlocklyComponent, { Block } from '@components/terminus/Blockly';

import '@components/terminus/blocks/customblocks';
import '@components/terminus/blocks/generator';
import { EmptyState } from '@boxyhq/internal-ui';
import { terminusOptions } from '@lib/env';

export interface Props {
  host?: string;
}

const TerminusIndexPage: NextPage<Props> = ({ host }: Props) => {
  if (!host) {
    return (
      <EmptyState
        title='This feature has not been enabled.'
        description='Please add the host for our Privacy Vault service to enable this feature.'
      />
    );
  }

  return (
    <BlocklyComponent initialXml={'<xml xmlns="http://www.w3.org/1999/xhtml"></xml>'}>
      <Block type='data_object_wrapper' />
      <Block type='data_object_wrapper_with_encryption' />
      <Block type='data_object_field_wrapper' />
      <Block type='data_object_field_type' />
      <Block type='data_object_field_default_types' />
      <Block type='data_object_field_encryption' />
      <Block type='data_object_field_mask' />
    </BlocklyComponent>
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      host: terminusOptions.hostUrl || null,
    },
  };
}

export default TerminusIndexPage;
