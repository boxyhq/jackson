export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'perplexity'
  | 'google-generative-ai'
  | 'ollama';

export const PII_POLICY_OPTIONS = ['none', 'detect_mask', 'detect_report', 'detect_block'] as const;

export type LLMConversation = {
  id: string;
  tenant: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
};

export type LLMChat = {
  id: string;
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
  piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
};

export type LLMConfig = {
  id: string;
  provider: string;
  tenant: string;
  models: string[];
  terminusToken: string;
};

export type LLMConfigMergedFromVault = {
  id: string;
  provider: string;
  tenant: string;
  models: string[];
  terminusToken: string;
  apiKey?: string;
  baseURL?: string;
  piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
};
