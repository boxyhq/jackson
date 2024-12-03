import { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import { generateChatResponse } from '@lib/llm';
import { terminusOptions } from '@lib/env';
import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth';
import { defaultHandler } from '@lib/api';
import { ApiError } from '@lib/error';
import { LLMProvider } from 'npm/src';

/**
 * If no conversationId is provided it will be treated as new conversation and will be created.
 * Post api will send the conversationId and message to the LLM provider and return the response.
 * If the conversationId is provided it will be treated as existing conversation and will be used to send the message.
 * Post api will send the conversationId and message to the LLM provider and return the response.
 */

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    POST: handlePOST,
  });
};

async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  const { chatController } = await jackson();
  const { tenant } = req.query;
  const { messages, model, provider, isChatWithPDFProvider } = req.body;

  let userId, email;
  const isAdminPortalTenant = tenant === terminusOptions.llm?.tenant;
  if (isAdminPortalTenant) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    userId = session.user.id;
    email = session.user.email;
  } else {
    userId = req.body.userId;
  }
  let { conversationId } = req.body;

  if (!isChatWithPDFProvider) {
    if (!provider) {
      res.status(400).json({ error: { message: 'Provider is required' } });
      return;
    }

    if (!model) {
      res.status(400).json({ error: { message: 'Model is required' } });
      return;
    }
  }

  try {
    const llmConfigs = await chatController.getLLMConfigsByTenantAndProvider(
      tenant as string,
      isChatWithPDFProvider ? 'openai' : provider
    );

    if (llmConfigs.length === 0) {
      res.status(400).json({
        error: {
          message: conversationId
            ? 'The provider and model related to this conversation are no longer available.'
            : 'LLM Config not found. Please create one before using LLM.',
        },
      });
      return;
    }
    if (!isChatWithPDFProvider) {
      const allowedModels = await chatController.getLLMModels(tenant as string, provider as LLMProvider);
      // const allowedModels = getLLMModels(provider, llmConfigs);

      if (allowedModels.length > 0 && allowedModels.find((m) => m.id === model.id) === undefined) {
        res.status(400).json({
          error: {
            message: conversationId
              ? 'The provider and model related to this conversation are no longer available.'
              : 'Model not allowed',
          },
        });
        return;
      }
    }

    let config;
    if (isChatWithPDFProvider) {
      config = llmConfigs.find((c) => c.isChatWithPDFProvider);
      if (config === undefined) {
        res.status(400).json({
          error: { message: 'No config found for chat with PDF' },
        });
        return;
      }
    } else {
      config = llmConfigs.find((c) => c.models.includes(model.id)) || llmConfigs[0];
    }

    const configFromVault = await chatController.getLLMConfigFromVault(
      tenant as string,
      config.terminusToken
    );

    if (isChatWithPDFProvider) {
      const jwt = await chatController.generateDocumentChatJWT({ email });
      configFromVault.apiKey = jwt;
    }

    if (!conversationId) {
      const conversation = await chatController.createConversation({
        tenant: tenant as string,
        userId,
        title: messages[0].content.trim().slice(0, 50),
        provider: isChatWithPDFProvider ? 'openai' : provider,
        model: model?.id || '',
        isChatWithPDFProvider,
      });
      conversationId = conversation.id;
    } else {
      const conversation = await chatController.getConversationById(conversationId);
      if (!conversation) {
        res.status(404).json({ error: { message: 'Conversation not found' } });
        return;
      }
    }

    await chatController.createChat({
      conversationId,
      role: 'user',
      content: messages[messages.length - 1].content,
    });

    const responseMessage = await generateChatResponse(
      messages.map((m) => {
        return {
          content: m.content,
          role: m.role,
        };
      }),
      isChatWithPDFProvider ? 'openai' : provider,
      isChatWithPDFProvider ? 'gpt-4o' : model,
      {
        ...config,
        ...configFromVault,
      },
      true
    );

    if (!responseMessage) {
      res.status(400).json({ error: 'Unable get response from LLM. Please try again.' });
    }

    if (typeof responseMessage === 'string') {
      await chatController.createChat({ conversationId, role: 'assistant', content: responseMessage });

      res.status(200).json({ message: responseMessage, conversationId });
    } else {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      let message = '';
      for await (const chunk of responseMessage) {
        if (!chunk || !chunk.choices) {
          continue;
        }
        if (chunk.choices.length === 0) {
          continue;
        }
        if (chunk.choices[0]?.delta?.content) {
          // skip first empty line
          if (!message && chunk.choices[0]?.delta?.content === '\n') {
            continue;
          }
          message += chunk.choices[0]?.delta?.content;
          if (!chunk) {
            continue;
          }
          await res.write(JSON.stringify(chunk) + '\n');
        }
      }
      await res.write(JSON.stringify({ conversationId }) + '\n');
      res.end();

      await chatController.createChat({ conversationId, role: 'assistant', content: message });
    }
  } catch (error: any) {
    console.error('Error in chat api', error);
    const { status, message } = decodeError(provider, error);
    throw new ApiError(message, status);
  }
}

const decodeError = (provider: string, error: any) => {
  switch (provider) {
    case 'openai':
      return {
        status: error.status || 400,
        message: error?.code || error?.message,
      };
    case 'mistral':
      return {
        status: (error?.message || '').indexOf('401') !== -1 ? 401 : 400,
        message: (error?.message || '').indexOf('Unauthorized') !== -1 ? 'Unauthorized' : error?.message,
      };
  }
  return { status: 500, message: error?.message };
};

export default handler;
