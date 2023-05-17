import type { NextApiRequest, NextApiResponse } from 'next';

import jackson from '@lib/jackson';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  if (method !== 'GET') {
    return res
      .setHeader('Allow', 'GET')
      .status(405)
      .json({ error: { message: `Method ${method} Not Allowed` } });
  }

  try {
    const { directorySyncController } = await jackson();

    const { data, error } = await directorySyncController.google.auth.generateAuthorizationUrl({
      directoryId: `b5e61332-9563-4b00-84db-78969ff0e1c3`,
    });

    if (error) {
      throw error;
    }

    console.log(data.authorizationUrl);

    return res.redirect(data.authorizationUrl).end();
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error });
  }
};

export default handler;
