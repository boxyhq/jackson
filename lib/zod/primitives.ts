import { PII_POLICY_OPTIONS } from '@boxyhq/saml-jackson';
import { z } from 'zod';

const maxLengthPolicies = {
  llmBaseUrl: 2048,
  llmModelName: 64,
  llmApiKey: 128,
  llmConfigId: 64,
};

export const llmPIIPolicy = z.enum(PII_POLICY_OPTIONS);

export const llmBaseUrl = z
  .string({
    required_error: 'Base URL is required',
    invalid_type_error: 'Base URL must be a string',
  })
  .url()
  .max(
    maxLengthPolicies.llmBaseUrl,
    `Base URL should have at most ${maxLengthPolicies.llmBaseUrl} characters`
  )
  .or(z.literal(''))
  .optional();

export const llmModels = z
  .array(
    z
      .string({
        invalid_type_error: 'Model must be a string',
        required_error: 'Model is required',
      })
      .max(
        maxLengthPolicies.llmModelName,
        `Model name should be at most ${maxLengthPolicies.llmModelName} characters`
      )
  )
  .min(0)
  .optional();

export const llmApiKey = z
  .string({
    required_error: 'API key is required',
    invalid_type_error: 'API key must be a string',
  })
  .max(maxLengthPolicies.llmApiKey, `API key should be at most ${maxLengthPolicies.llmApiKey} characters`)
  .optional();

export const llmProvider = (providers) => {
  const LLM_PROVIDERS_KEYS = providers.map((provider) => provider.id);
  const maxLengthProvider = Math.max(...LLM_PROVIDERS_KEYS.map((provider) => provider.length));
  return z
    .string({
      required_error: 'Provider is required',
      invalid_type_error: 'Provider must be a string',
    })
    .min(1, `Provider is required`)
    .max(maxLengthProvider, 'Invalid provider length')
    .refine((provider) => {
      return LLM_PROVIDERS_KEYS.includes(provider);
    }, 'Invalid provider');
};

export const llmConfigId = z
  .string({
    required_error: 'Config Id is required',
    invalid_type_error: 'Config Id must be a string',
  })
  .min(1, `Config Id is required`)
  .max(
    maxLengthPolicies.llmConfigId,
    `Config Id should be at most ${maxLengthPolicies.llmConfigId} characters`
  );
