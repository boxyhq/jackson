import type { LLMConfig } from '@boxyhq/saml-jackson';
import { ChatCompletionChunk } from 'openai/resources';
import { ApiError } from './error';
import { llmOptions, terminusOptions } from './env';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources';
import MistralClient from '@mistralai/mistralai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ollama } from 'ollama';

export const PII_POLICY_OPTIONS = ['none', 'detect_mask', 'detect_report', 'detect_block'] as const;

export const PII_POLICY: {
  [key in (typeof PII_POLICY_OPTIONS)[number]]: string;
} = {
  none: 'None',
  detect_mask: 'Detect & Mask',
  detect_report: 'Detect & Report',
  detect_block: 'Detect & Block',
} as const;

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

type LLMConfigWithAPIKey = LLMConfig & {
  apiKey: string;
  baseURL: string;
  piiPolicy: (typeof PII_POLICY_OPTIONS)[number];
};

export const LLM_PROVIDERS: {
  [key in LLMProvider]: {
    name: string;
    models: LLMModel[];
  };
} = {
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

export const getLLMModels = (provider: string, llmConfigs?: LLMConfig[]): LLMModel[] => {
  if (!LLM_PROVIDERS[provider]) {
    return [];
  }
  if (!llmConfigs) {
    return LLM_PROVIDERS[provider].models;
  } else if (llmConfigs.length === 0) {
    return [];
  } else {
    const providerConfigs = llmConfigs.filter((c: LLMConfig) => {
      return c.provider === provider;
    });
    const configModels = Array.from(new Set(providerConfigs.map((c: LLMConfig) => c.models).flat())).filter(
      (m) => Boolean(m)
    );
    if (configModels.length === 0) {
      return LLM_PROVIDERS[provider].models;
    } else {
      const models = configModels.map((model: string) =>
        LLM_PROVIDERS[provider].models.find((m) => m.id === model)
      );
      return models.filter((m) => Boolean(m)) as LLMModel[];
    }
  }
};

const useTerminus = {
  openai: true,
  anthropic: false,
  mistral: true,
  groq: false,
  perplexity: true,
  'google-generative-ai': false,
  ollama: false,
};

export const LLM_HANDLERS: {
  [key in LLMProvider]: (
    messages: any[],
    model: LLMModel,
    config: LLMConfigWithAPIKey
  ) => Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>>;
} = {
  openai: openaiHandler,
  anthropic: anthropicHandler,
  mistral: mistralHandler,
  groq: groqHandler,
  perplexity: perplexityHandler,
  'google-generative-ai': googleGenAIHandler,
  ollama: ollamaHandler,
};

export async function generateChatResponse(
  messages: any[],
  provider: string,
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<string | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  if (!LLM_HANDLERS[provider]) {
    throw new ApiError('Provider not supported', 400);
  }
  // Set the base URL to the terminus proxy if the provider is supported
  if (useTerminus[provider]) {
    config.baseURL = terminusOptions.hostUrl + `/v1/proxy/${provider}`;
  }
  if (isStream) {
    return LLM_HANDLERS[provider](messages, model, config, isStream);
  } else {
    const { text } = await LLM_HANDLERS[provider](messages, model, config);
    return text || '';
  }
}

// TODO: Need to test this
export async function anthropicHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey
): Promise<{ text: string }> {
  const anthropic = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const stream = await anthropic.messages.create({
    model: model.id,
    max_tokens: model.max_tokens || 1024,
    messages,
    stream: true,
  });
  let text = '';
  // Iterate over the stream and print each event
  for await (const messageStreamEvent of stream) {
    switch (messageStreamEvent.type) {
      case 'message_start':
        console.log('Message start');
        for (const content of messageStreamEvent.message.content) {
          if (content.type === 'text') {
            text += content.text;
          } else {
            console.log('Unsupported content type', content.type);
          }
        }
        break;
      case 'message_stop':
        console.log('Message stop');
        break;
      case 'content_block_start':
        console.log('Content block start');
        if (messageStreamEvent.content_block.type === 'text') {
          text += (messageStreamEvent.content_block as TextBlock).text;
        } else {
          console.log('Unsupported content block type');
        }
        break;
      case 'content_block_delta':
        console.log('Content block delta');
        break;
      case 'content_block_stop':
        console.log('Content block stop');
        break;
    }
  }
  return {
    text,
  };
}

export async function mistralHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const mistral = new MistralClient(config.apiKey, config.baseURL || undefined);
  const stream = await mistral.chatStream({
    model: model.id,
    messages,
  });

  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'mistral');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const msg of stream) {
      text += msg?.choices[0]?.delta?.content || '';
    }
    return {
      text,
    };
  }
}

export async function openaiHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const stream = await openai.chat.completions.create({
    messages,
    model: model.id,
    stream: true,
  });
  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'openai');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta?.content || '';
    }
    return { text };
  }
}

export async function groqHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const groq = new Groq({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  const stream = await groq.chat.completions.create({
    messages,
    model: model.id,
    stream: true,
  });
  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'groq');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta?.content || '';
    }
    return {
      text,
    };
  }
}

export async function perplexityHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || 'https://api.perplexity.ai',
  });
  const stream = await openai.chat.completions.create({
    messages,
    model: model.id,
    stream: true,
  });
  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'perplexity');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const chunk of stream) {
      text += chunk.choices[0]?.delta?.content || '';
    }
    return {
      text,
    };
  }
}

export async function googleGenAIHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const googleGenAI = new GoogleGenerativeAI(config.apiKey || '');

  const instance = googleGenAI.getGenerativeModel(
    { model: model.id },
    {
      baseUrl: config.baseURL || undefined,
    }
  );
  const { stream } = await instance.generateContentStream({
    contents: messages.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.content,
        },
      ],
    })),
  });
  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'google-generative-ai');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const chunk of stream) {
      text += chunk.text() || '';
    }
    return {
      text,
    };
  }
}

export async function ollamaHandler(
  messages: any[],
  model: LLMModel,
  config: LLMConfigWithAPIKey,
  isStream = false
): Promise<{ text: string } | AsyncGenerator<ChatCompletionChunk, void, unknown>> {
  const ollama = new Ollama({ host: config.baseURL || undefined });
  const stream = await ollama.chat({
    model: model?.id || 'llama3',
    messages,
    stream: true,
  });
  async function* streamGenerator() {
    for await (const chunk of stream) {
      yield toOpenAIChunk(chunk, 'ollama');
    }
  }
  if (isStream) {
    return streamGenerator();
  } else {
    let text = '';
    for await (const chunk of stream) {
      text += chunk.message.content || '';
    }
    return { text };
  }
}

export const fileUploadOptions = {
  headers: {
    Authorization: `Bearer ${llmOptions.fileUpload.token}`,
  },
};

function toOpenAIChunk(chunk: any, provider: LLMProvider): ChatCompletionChunk {
  switch (provider) {
    case 'openai':
      return chunk as ChatCompletionChunk;
    case 'anthropic':
      return {
        choices: [
          {
            delta: {
              content: chunk.text,
            },
          },
        ],
      } as ChatCompletionChunk;
    case 'mistral':
      return {
        choices: chunk.choices,
      } as ChatCompletionChunk;
    case 'groq':
      return {
        choices: chunk.choices,
      } as ChatCompletionChunk;
    case 'perplexity':
      return chunk as ChatCompletionChunk;
    case 'google-generative-ai':
      return {
        choices: [
          {
            delta: {
              content: chunk.text(),
            },
          },
        ],
      } as ChatCompletionChunk;
    case 'ollama':
      return {
        choices: [
          {
            delta: {
              content: chunk.message.content,
            },
          },
        ],
      } as ChatCompletionChunk;
    default:
      throw new ApiError('Provider not supported', 400);
  }
}
