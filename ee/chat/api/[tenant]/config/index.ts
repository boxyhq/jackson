import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { createLLMConfigSchema, validateWithSchema } from '@lib/zod';
import { LLMProvider } from '@boxyhq/saml-jackson';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    GET: handleGET,
    POST: handlePOST,
  });
};

// Get Chat Configs
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const configs = await chatController.getLLMConfigs(req.query.tenant as string);

  res.json({ data: configs });
};

// Create Chat Config
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatController } = await jackson();

  const providers = await chatController.getLLMProviders(req.query.tenant as string, false);

  const { provider, apiKey, models, isChatWithPDFProvider, baseURL, tenant } = validateWithSchema(
    createLLMConfigSchema(providers),
    { ...req.body, ...req.query }
  );

  if (!apiKey && provider !== 'ollama' && !isChatWithPDFProvider) {
    throw new Error('API Key is required');
  }

  const config = await chatController.createLLMConfig({
    provider: provider as LLMProvider,
    models: models || [],
    isChatWithPDFProvider,
    apiKey,
    baseURL,
    tenant,
  });

  res.status(201).json({ data: { config } });
};

export default handler;
