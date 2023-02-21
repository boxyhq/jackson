import axios from 'axios';

import type { AdminToken } from 'types/retraced';
import { retracedOptions } from './env';
import { getToken as getNextAuthToken } from 'next-auth/jwt';
import type { NextApiRequest } from 'next';
import { sessionName } from './constants';

export const getToken = async (req: NextApiRequest): Promise<AdminToken> => {
  const token = await getNextAuthToken({
    req,
    cookieName: sessionName,
  });

  const { data } = await axios.post<{ adminToken: AdminToken }>(
    `${retracedOptions?.hostUrl}/admin/v1/user/_login`,
    {
      claims: {
        upstreamToken: 'ADMIN_ROOT_TOKEN',
        email: token!.email,
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
