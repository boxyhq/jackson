import type { IncomingMessage } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import type { Readable } from 'node:stream';
import { defaultHandler } from '@lib/api';
import { llmOptions, terminusOptions } from '@lib/env';
import jackson from '@lib/jackson';
import { getServerSession } from 'next-auth';
import { authOptions } from 'pages/api/auth/[...nextauth]';

// Function to force consume the response body to avoid memory leaks
export const forceConsume = async (response) => {
  try {
    await response.text();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Do nothing
  }
};

// Get raw body as buffer
async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Parse multipart form data to extract file content
async function parseMultipartFormData(req: IncomingMessage, boundary: string) {
  const buffer = await getRawBody(req);
  const parts = buffer.toString().split(`--${boundary}`);

  let fileName = '';
  let fileBuffer: Buffer | null = null;

  parts.forEach((part) => {
    if (part.includes('Content-Disposition: form-data; name="file"; filename=')) {
      fileName = part.split('filename=')[1].split('"')[1];
      const start = buffer.indexOf('\r\n\r\n') + 4;
      const end = buffer.lastIndexOf('\r\n--');
      fileBuffer = buffer.subarray(start, end);
    }
  });

  return { fileName, fileBuffer };
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await defaultHandler(req, res, {
    POST: handlePOST,
  });
};

export async function handlePOST(req, res) {
  const { chatController } = await jackson();

  // TODO: Upload file against tenant/user

  const { tenant } = req.query;

  let email;
  const isAdminPortalTenant = tenant === terminusOptions.llm?.tenant;
  if (isAdminPortalTenant) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }
    email = session.user.email;
  } else {
    // email = req.body.userId;
  }

  const contentType = req.headers['content-type'];
  if (!contentType) {
    res.status(400).json({ error: 'Content-Type header is missing' });
    return;
  }

  const boundary = contentType.split('boundary=')[1];

  const { fileName, fileBuffer } = await parseMultipartFormData(req, boundary);

  if (!fileBuffer || !fileName) {
    res.status(400).json({ error: 'File not found in the request' });
    return;
  }

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);

  const jwt = await chatController.generateDocumentChatJWT({ email });

  try {
    const response = await fetch(`${llmOptions.documentChat.hostUrl}/chat/upload_file`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      method: 'POST',
      body: formData,
    });

    const status = response.status;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      res.status(status).json(await response.json());
    } else {
      forceConsume(res);
      res.status(status).end();
    }
  } catch (error: any) {
    const message = error.message || 'An error occurred. Please try again.';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

export default handler;
