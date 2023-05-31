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

    const { directoryId } = req.query as { directoryId: string };

    const { data: directory, error: directoryError } = await directorySyncController.directories.get(
      directoryId
    );

    if (!directoryError) {
      throw directoryError;
    }

    // Provider: Google
    if (directory?.type === 'google') {
      const { data, error } = await directorySyncController.google.generateAuthorizationUrl({
        directoryId,
      });

      if (error) {
        throw error;
      }

      return res.redirect(data.authorizationUrl).end();
    }

    throw new Error('Directory type not supported.');
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({ error: { message } });
  }
};

export default handler;
