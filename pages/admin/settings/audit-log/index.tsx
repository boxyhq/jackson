import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { retracedOptions } from '@lib/env';
import { getViewerToken } from '@ee/audit-log/lib/retraced';

export { default } from 'ee/audit-log/pages/index';

export async function getServerSideProps({ locale, req }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      viewerToken: await getViewerToken(req),
      retracedHostUrl: retracedOptions.hostUrl,
    },
  };
}
