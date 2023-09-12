import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await getRoles(req, res);
    default:
      res.setHeader('Allow', 'GET');
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

const getRoles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { data } = await axios.get<any>(`${terminusOptions.hostUrl}/v1/admin/roles`, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
      'x-access-token': terminusOptions.adminToken,
    },
  });

  return res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
