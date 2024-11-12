export const PII_POLICY_OPTIONS = [
  'none',
  'detect_mask',
  'detect_redact',
  'detect_report',
  'detect_block',
] as const;

export const PII_POLICY: {
  [key in (typeof PII_POLICY_OPTIONS)[number]]: string;
} = {
  none: 'None',
  detect_mask: 'Detect & Mask',
  detect_redact: 'Detect & Redact',
  detect_report: 'Detect & Report',
  detect_block: 'Detect & Block',
} as const;

type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'perplexity'
  | 'google-generative-ai'
  | 'ollama';

export type LLMProvidersOptionsType = { id: LLMProvider; name: string }[];

export type LLMProvidersType = {
  [key in LLMProvider]: {
    name: string;
    models: LLMModel[];
  };
};

export type LLMConfig = {
  id: string;
  createdAt: number;
  provider: LLMProvider;
  tenant: string;
  models: string[];
  terminusToken: string;
  apiKey?: string;
  baseURL?: string;
  isChatWithPDFProvider?: boolean;
  piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
};

export type LLMModel = {
  id: string;
  name: string;
  max_tokens?: number;
};

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
  role: string;
  content: string;
  id: string;
  conversationId: string;
  createdAt: string;
};
