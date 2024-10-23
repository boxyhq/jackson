import { LLMProvidersType } from './types';

export const LLM_PROVIDERS: LLMProvidersType = {
  openai: {
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
      },
      {
        id: 'gpt-4o-2024-05-13',
        name: 'GPT-4o 2024-05-13',
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
      },
      {
        id: 'gpt-4-turbo-2024-04-09',
        name: 'GPT-4 Turbo 2024-04-09',
      },
      {
        id: 'gpt-4-0125-preview',
        name: 'GPT-4 0125 Preview',
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo Preview',
      },
      {
        id: 'gpt-4-1106-preview',
        name: 'GPT-4 1106 Preview',
      },
      {
        id: 'gpt-4-vision-preview',
        name: 'GPT-4 Vision Preview',
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
      },
      {
        id: 'gpt-4-0613',
        name: 'GPT-4 0613',
      },
      {
        id: 'gpt-4-32k',
        name: 'GPT-4 32k',
      },
      {
        id: 'gpt-4-32k-0314',
        name: 'GPT-4 32k 0314',
      },
      {
        id: 'gpt-4-32k-0613',
        name: 'GPT-4 32k 0613',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16k',
      },
      {
        id: 'gpt-3.5-turbo-0301',
        name: 'GPT-3.5 Turbo 0301',
      },
      {
        id: 'gpt-3.5-turbo-0613',
        name: 'GPT-3.5 Turbo 0613',
      },
      {
        id: 'gpt-3.5-turbo-1106',
        name: 'GPT-3.5 Turbo 1106',
      },
      {
        id: 'gpt-3.5-turbo-0125',
        name: 'GPT-3.5 Turbo 0125',
      },
      {
        id: 'gpt-3.5-turbo-16k-0613',
        name: 'GPT-3.5 Turbo 16k 0613',
      },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonet',
        max_tokens: 4096,
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        max_tokens: 4096,
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        max_tokens: 4096,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        max_tokens: 4096,
      },
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        max_tokens: 4096,
      },
      {
        id: 'claude-2.0',
        name: 'Claude 2',
        max_tokens: 4096,
      },
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        max_tokens: 4096,
      },
    ],
  },
  mistral: {
    name: 'Mistral',
    models: [
      {
        id: 'open-mistral-7b',
        name: 'Mistral 7B',
      },
      {
        id: 'open-mixtral-8x7b',
        name: 'Mixtral 8x7B',
      },
      {
        id: 'open-mixtral-8x22b',
        name: 'Mixtral 8x22B',
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
      },
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
      },
      {
        id: 'codestral-latest',
        name: 'Codestral',
      },
    ],
  },
  groq: {
    name: 'Groq',
    models: [
      {
        id: 'gemma-7b-it',
        name: 'Gemma 7B IT',
      },
      {
        id: 'llama3-70b-8192',
        name: 'Llama3 70B 8192',
      },
      {
        id: 'llama3-8b-8192',
        name: 'Llama3 8B 8192',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B 32768',
      },
    ],
  },
  perplexity: {
    name: 'Perplexity',
    models: [
      {
        id: 'llama-3-sonar-small-32k-chat',
        name: 'Llama 3 Sonar Small 32k Chat',
      },
      {
        id: 'llama-3-sonar-small-32k-online',
        name: 'Llama 3 Sonar Small 32k Online',
      },
      {
        id: 'llama-3-sonar-large-32k-chat',
        name: 'Llama 3 Sonar Large 32k Chat',
      },
      {
        id: 'llama-3-sonar-large-32k-online',
        name: 'Llama 3 Sonar Large 32k Online',
      },
      {
        id: 'llama-3-8b-instruct',
        name: 'Llama 3 8B Instruct',
      },
      {
        id: 'llama-3-70b-instruct',
        name: 'Llama 3 70B Instruct',
      },
      {
        id: 'mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
      },
    ],
  },
  'google-generative-ai': {
    name: 'Google Generative AI',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
      },
      {
        id: 'gemini-1.0-pro',
        name: 'Gemini 1.0 Pro',
      },
      {
        id: 'text-embedding-004',
        name: 'Text Embedding',
      },
    ],
  },
  ollama: {
    name: 'Ollama',
    models: [],
  },
};
