import type { LLMConfig, LLMProvider } from '@boxyhq/saml-jackson';
import { ChatCompletionChunk } from 'openai/resources';
import { ApiError } from './error';
import { terminusOptions } from './env';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources';
import MistralClient from '@mistralai/mistralai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ollama } from 'ollama';

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

export type LLMModel = {
  id: string;
  name: string;
  max_tokens?: number;
};

type LLMConfigWithAPIKey = LLMConfig & {
  apiKey: string;
  baseURL: string;
};

const useTerminus = {
  openai: true,
  anthropic: false,
  mistral: true,
  groq: false,
  perplexity: true,
  'google-generative-ai': false,
  ollama: true,
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
  if (!config.isChatWithPDFProvider && !LLM_HANDLERS[provider]) {
    throw new ApiError('Provider not supported', 400);
  }
  // Set the base URL to the terminus proxy if the provider is supported
  if (useTerminus[provider]) {
    const params = new URLSearchParams({
      baseURL: config.baseURL,
    });

    const encodedBaseURL = Buffer.from(params.toString()).toString('base64url');
    config.baseURL = terminusOptions.hostUrl + `/v1/product/proxy/${encodedBaseURL}/${provider}`;
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
        for (const content of messageStreamEvent.message.content) {
          if (content.type === 'text') {
            text += content.text;
          }
        }
        break;
      case 'message_stop':
        break;
      case 'content_block_start':
        if (messageStreamEvent.content_block.type === 'text') {
          text += (messageStreamEvent.content_block as TextBlock).text;
        }
        break;
      case 'content_block_delta':
        break;
      case 'content_block_stop':
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
