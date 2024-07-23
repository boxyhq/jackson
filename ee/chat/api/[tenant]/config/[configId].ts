import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteLLMConfigSchema, updateLLMConfigSchema, validateWithSchema } from '@lib/zod';
import jackson from '@lib/jackson';
import { LLMProvider } from '@lib/llm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'DELETE':
        await handleDELETE(req, res);
        break;
      case 'PUT':
        await handlePUT(req, res);
        break;
      default:
        res.setHeader('Allow', 'DELETE, PUT');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const { message, statusCode = 500 } = error;
    res.status(statusCode).json({ error: { message } });
  }
}

// Delete llm config
const handleDELETE = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const { configId, tenant } = validateWithSchema(deleteLLMConfigSchema, req.query);

  await chatController.deleteLLMConfig({
    configId,
    tenant: tenant,
  });

  res.status(204).end();
};

// Update llm config
const handlePUT = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const { configId, tenant, apiKey, models, baseURL, piiPolicy, provider } = validateWithSchema(
    updateLLMConfigSchema,
    {
      ...req.body,
      ...req.query,
    }
  );

  await chatController.updateLLMConfig(configId, {
    tenant,
    apiKey,
    baseURL,
    piiPolicy,
    provider: provider as LLMProvider,
    models,
  });

  res.status(204).end();
};
