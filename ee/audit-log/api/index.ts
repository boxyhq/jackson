import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';
import { strings } from '@lib/strings';
import { getViewerToken } from '../lib/retraced';
import { retracedOptions } from '@lib/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { checkLicense } = await jackson();

    if (!(await checkLicense())) {
      return res.status(404).json({
        error: {
          message: strings['enterprise_license_not_found'],
        },
      });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        return await handleGET(req, res);
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (err: any) {
    const { message, statusCode = 500 } = err;

    return res.status(statusCode).json({ error: { message } });
  }
}

// Get the viewer token from Retraced
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    viewerToken: await getViewerToken(req),
    retracedHostUrl: retracedOptions.hostUrl,
  });
};
