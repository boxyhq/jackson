import jackson from '@lib/jackson';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Create the SLO request
  const createRequest = async () => {
    const { nameId, tenant, product, redirectUrl } = req.query;

    try {
      const { logoutController } = await jackson();

      const { logoutUrl } = await logoutController.createRequest({
        nameId: <string>nameId,
        tenant: <string>tenant,
        product: <string>product,
        redirectUrl: <string>redirectUrl,
      });

      res.redirect(302, logoutUrl);
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      res.status(statusCode).send(message);
    }
  };

  // Handle the response from the IdP
  const handleResponse = async () => {
    const { SAMLResponse, RelayState } = req.body;

    try {
      const { logoutController } = await jackson();

      const { redirectUrl } = await logoutController.handleResponse({
        SAMLResponse,
        RelayState,
      });

      res.redirect(302, redirectUrl);
    } catch (err: any) {
      const { message, statusCode = 500 } = err;

      res.status(statusCode).send(message);
    }
  };

  switch (method) {
    case 'GET':
      createRequest();
      break;
    case 'POST':
      handleResponse();
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
