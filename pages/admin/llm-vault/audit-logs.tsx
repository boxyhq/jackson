import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { retracedOptions, terminusOptions } from '@lib/env';

import { getToken } from '@lib/retraced';
import type { Project } from 'types/retraced';
import axios from 'axios';
import jackson from '@lib/jackson';
import { NextApiRequest, GetServerSideProps } from 'next';

export { default } from '@ee/terminus/pages/audit-logs';

export const getServerSideProps = (async ({ locale, req }) => {
  const { checkLicense } = await jackson();

  if (!terminusOptions.llmRetracedProjectId) {
    return {
      notFound: true,
    };
  } else {
    const token = await getToken(req as NextApiRequest);
    try {
      const { data } = await axios.get<{ project: Project }>(
        `${retracedOptions?.hostUrl}/admin/v1/project/${terminusOptions.llmRetracedProjectId}`,
        {
          headers: {
            Authorization: `id=${token.id} token=${token.token} admin_token=${retracedOptions.adminToken}`,
          },
        }
      );
      if (data.project.environments.length === 0) {
        return {
          notFound: true,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
      host: retracedOptions.externalUrl,
      projectId: terminusOptions.llmRetracedProjectId,
      hasValidLicense: await checkLicense(),
    },
  };
}) satisfies GetServerSideProps;
