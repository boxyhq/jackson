import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getRoles,
  });
}

const getRoles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { data } = await axios.get<any>(`${terminusOptions.hostUrl}/v1/manage/roles`, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.json({
    data,
    error: null,
  });
};

export default handler;
