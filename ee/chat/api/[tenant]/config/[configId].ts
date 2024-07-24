import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteLLMConfigSchema, updateLLMConfigSchema, validateWithSchema } from '@lib/zod';
import jackson from '@lib/jackson';
import { LLMProvider } from '@lib/llm';
import { defaultHandler } from '@lib/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    DELETE: handleDELETE,
    PUT: handlePUT,
  });
};

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

export default handler;
