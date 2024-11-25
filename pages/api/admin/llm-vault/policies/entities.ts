import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getSupportedPIIEntities,
  });
}

const getTerminusUrl = () => {
  return `${terminusOptions.hostUrl}/v1/manage/supportedpiientities`;
};

const getSupportedPIIEntities = async (req: NextApiRequest, res: NextApiResponse) => {
  const { data } = await axios.get<any>(getTerminusUrl(), {
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
