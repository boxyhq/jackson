import type { NextApiRequest, NextApiResponse } from 'next';
import retraced from '@ee/retraced';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handlePOST(req, res);
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;

    return res.status(statusCode).json({
      error: { message },
    });
  }
};

// Get Security Logs config by id
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { action, crud, actor, sourceIp, group, target, productId } = req.body;
  await retraced.reportEvent({
    action: action,
    crud: crud,
    actor: actor,
    req,
    group: group,
    target: target,
    sourceIp: sourceIp,
    productId: productId,
  });
  res.json({
    data: {
      success: true,
    },
  });
};

export default handler;
