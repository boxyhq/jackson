// Maintain /config path for backward compatibility

import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';
import type { GetConfigQuery } from '@boxyhq/saml-jackson';
import { sendAudit } from '@ee/audit-log/lib/retraced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { connectionAPIController } = await jackson();
    if (req.method === 'POST') {
      const connection = await connectionAPIController.config(req.body);

      await sendAudit({
        action: 'sso.connection.create',
        crud: 'c',
        req,
      });

      return res.json(connection);
    } else if (req.method === 'GET') {
      res.json(await connectionAPIController.getConfig(req.query as GetConfigQuery));
    } else if (req.method === 'PATCH') {
      const connection = await connectionAPIController.updateConfig(req.body);

      await sendAudit({
        action: 'sso.connection.update',
        crud: 'u',
        req,
      });

      return res.status(204).end(connection);
    } else if (req.method === 'DELETE') {
      const connection = await connectionAPIController.deleteConfig(req.body);

      await sendAudit({
        action: 'sso.connection.delete',
        crud: 'd',
        req,
      });

      return res.status(204).end(connection);
    } else {
      throw { message: 'Method not allowed', statusCode: 405 };
    }
  } catch (err: any) {
    console.error('config api error:', err);
    const { message, statusCode = 500 } = err;

    res.status(statusCode).send(message);
  }
}
