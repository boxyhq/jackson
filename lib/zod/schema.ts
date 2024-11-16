import { z } from 'zod';
import { llmApiKey, llmBaseUrl, llmConfigId, llmModels, llmProvider } from './primitives';

export const updateLLMConfigSchema = (providers) =>
  z.object({
    configId: llmConfigId,
    tenant: z.string(),
    provider: llmProvider(providers),
    isChatWithPDFProvider: z.boolean().optional(),
    apiKey: llmApiKey,
    models: llmModels,
    baseURL: llmBaseUrl,
  });

export const deleteLLMConfigSchema = z.object({
  configId: llmConfigId,
  tenant: z.string(),
});

export const createLLMConfigSchema = (providers) =>
  z.object({
    tenant: z.string(),
    provider: llmProvider(providers),
    isChatWithPDFProvider: z.boolean().optional(),
    apiKey: llmApiKey,
    models: llmModels,
    baseURL: llmBaseUrl,
  });
