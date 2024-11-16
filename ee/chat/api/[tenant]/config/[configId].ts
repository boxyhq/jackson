import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteLLMConfigSchema, updateLLMConfigSchema, validateWithSchema } from '@lib/zod';
import jackson from '@lib/jackson';
import { LLMProvider } from '@boxyhq/saml-jackson';
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

  const providers = await chatController.getLLMProviders(req.query.tenant as string, false);

  const { configId, tenant, apiKey, models, baseURL, provider } = validateWithSchema(
    updateLLMConfigSchema(providers),
    {
      ...req.body,
      ...req.query,
    }
  );

  await chatController.updateLLMConfig(configId, {
    tenant,
    apiKey,
    baseURL,
    provider: provider as LLMProvider,
    models,
  });

  res.status(204).end();
};

export default handler;
