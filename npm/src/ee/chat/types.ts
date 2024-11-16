export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'perplexity'
  | 'google-generative-ai'
  | 'ollama';

export type LLMModel = {
  id: string;
  name: string;
  max_tokens?: number;
};

export type LLMProvidersType = {
  [key in LLMProvider]: {
    name: string;
    models: LLMModel[];
  };
};

export type LLMProvidersOptionsType = { id: LLMProvider; name: string }[];

export const PII_POLICY_OPTIONS = [
  'none',
  'detect_mask',
  'detect_redact',
  'detect_report',
  'detect_block',
] as const;

export type LLMConversation = {
  id: string;
  tenant: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
  isChatWithPDFProvider?: boolean;
  createdAt: number;
};

export type LLMChat = {
  id: string;
  createdAt: number;
  conversationId: string;
  content: string;
  role: string;
};

export type LLMConfigPayload = {
  provider: LLMProvider;
  tenant: string;
  models?: string[];
  apiKey?: string;
  baseURL?: string;
  isChatWithPDFProvider?: boolean;
};

export type LLMConfig = {
  id: string;
  createdAt: number;
  provider: LLMProvider;
  baseURL: string;
  tenant: string;
  models: string[];
  isChatWithPDFProvider?: boolean;
  terminusToken: string;
};

export type LLMConfigMergedFromVault = {
  id: string;
  createdAt: number;
  provider: LLMProvider;
  tenant: string;
  models: string[];
  terminusToken: string;
  apiKey?: string;
  baseURL?: string;
  isChatWithPDFProvider?: boolean;
};
