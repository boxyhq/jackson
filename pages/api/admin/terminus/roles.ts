import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';
import { withAdmin } from '@lib/withAdmin';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await withAdmin(req, res, {
    GET: getRoles,
  });
}

const getRoles = async (req: NextApiRequest, res: NextApiResponse) => {
  const { data } = await axios.get<any>(`${terminusOptions.hostUrl}/v1/manage/roles`, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
      'x-access-token': terminusOptions.adminToken,
    },
  });

  // TODO:
  // Not sure 201 is the right status code here
  res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
