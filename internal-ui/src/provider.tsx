import { createContext } from 'react';
import type { NextRouter } from 'next/router';
import { LLMProvider } from './types';
export const BUIContext = createContext<{ router: NextRouter | null }>({ router: null });

export const BUIProvider = BUIContext.Provider;

export const ChatContext = createContext<{
  provider?: LLMProvider;
  model?: string;
  urls:
    | {
        chat: string;
        conversation: string;
        llmConfig: string;
        llmProviders: string;
        fileUpload: string;
      }
    | undefined;
  onError?: (error: Error | string) => void;
  onSuccess?: (success: string) => void;
}>({
  urls: undefined,
});

export const ChatContextProvider = ChatContext.Provider;
