import { z } from 'zod';
import { llmApiKey, llmBaseUrl, llmConfigId, llmModels, llmPIIPolicy, llmProvider } from './primitives';

export const updateLLMConfigSchema = z.object({
  configId: llmConfigId,
  tenant: z.string(),
  provider: llmProvider,
  apiKey: llmApiKey,
  models: llmModels,
  baseURL: llmBaseUrl,
  piiPolicy: llmPIIPolicy,
});

export const deleteLLMConfigSchema = z.object({
  configId: llmConfigId,
  tenant: z.string(),
});

export const createLLMConfigSchema = z.object({
  tenant: z.string(),
  provider: llmProvider,
  apiKey: llmApiKey,
  models: llmModels,
  baseURL: llmBaseUrl,
  piiPolicy: llmPIIPolicy,
});
