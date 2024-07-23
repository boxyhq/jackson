import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { createLLMConfigSchema, validateWithSchema } from '@lib/zod';
import { LLMProvider } from '@lib/llm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get Chat Configs
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const configs = await chatController.getLLMConfigs(req.query.tenant as string);

  res.json({ data: configs });
};

// Create Chat Config
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const { provider, apiKey, models, baseURL, piiPolicy, tenant } = validateWithSchema(
    createLLMConfigSchema,
    req.body
  );

  if (!apiKey && provider !== 'ollama') {
    throw new Error('API Key is required');
  }

  const config = await chatController.createLLMConfig({
    provider: provider as LLMProvider,
    models: models || [],
    apiKey,
    baseURL,
    piiPolicy,
    tenant,
  });

  res.status(201).json({ data: { config } });
};
