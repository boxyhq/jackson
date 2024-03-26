import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { terminusOptions } from '@lib/env';
import { defaultHandler } from '@lib/api';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await defaultHandler(req, res, {
    GET: getModel,
    POST: saveModel,
  });
}

const getTerminusUrl = (id) => {
  return `${terminusOptions.hostUrl}/v1/manage/${id}/model`;
};

const getModel = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  const { data } = await axios.get<any>(getTerminusUrl(id), {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.json({
    data,
    error: null,
  });
};

const saveModel = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  const { data } = await axios.post<any>(getTerminusUrl(id), req.body, {
    headers: {
      Authorization: `api-key ${terminusOptions.adminToken}`,
    },
  });

  res.status(201).json({
    data,
    error: null,
  });
};

export default handler;
