import axios from 'axios';

import type { AdminToken } from 'types/retraced';
import { retracedOptions } from './env';

export const getToken = async (): Promise<AdminToken> => {
  const { data } = await axios.post<{ adminToken: AdminToken }>(
    `${retracedOptions?.host}/admin/v1/user/_login`,
    {
      claims: {
        upstreamToken: 'ADMIN_ROOT_TOKEN',
        email: process.env.NEXTAUTH_ACL,
      },
    },
    {
      headers: {
        Authorization: `token=${retracedOptions?.adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return data.adminToken;
};
