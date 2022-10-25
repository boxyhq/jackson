import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { strategyChecker } from '@lib/utils';

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handlePOST(req, res);
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
  }
};

// Save setup using setup link
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { setupLinkController, connectionAPIController, directorySyncController } = await jackson();
  const token = req.query.token;
  const { data: setup, error: err } = await setupLinkController.getByToken(token);
  if (err) {
    return res.status(err ? err.code : 201).json({ err });
  }
  const body = {
    ...req.body,
    tenant: setup?.tenant,
    product: setup?.product,
  };
  let data, error, tmp;
  if (setup) {
    if (setup?.validTill > +new Date()) {
      data = setup;
      switch (setup?.path) {
        case '/admin/connection/new':
          // eslint-disable-next-line no-case-declarations
          const { isSAML, isOIDC } = strategyChecker(req);
          if (isSAML) {
            return res.json(await connectionAPIController.createSAMLConnection(body));
          } else if (isOIDC) {
            return res.json(await connectionAPIController.createOIDCConnection(body));
          } else {
            throw { message: 'Missing SSO connection params', statusCode: 400 };
          }
        case '/admin/directory-sync/new':
          tmp = await directorySyncController.directories.create(body);
          return res.status(tmp.error ? tmp.error.code : 201).json({
            data: tmp.data,
            error: tmp.error,
          });
        default:
          data = undefined;
          error = {
            code: 400,
            message: 'Setup Link configuration is invalid!',
          };
          break;
      }
    } else {
      data = undefined;
      error = {
        code: 400,
        message: 'Setup Link expired!',
      };
    }
  } else {
    data = undefined;
    error = {
      code: 404,
      message: 'Invalid setup token!',
    };
  }

  return res.status(error ? error.code : 201).json({ data, error });
};

export default handler;
