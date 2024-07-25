import { llmOptions } from '@lib/env';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // TODO: Upload file against tenant/user
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: { message: `Method ${req.method} not allowed.` } });
    return;
  }

  try {
    // Forward the request to the backend API
    const response = await axios({
      method: 'POST',
      url: `${llmOptions.fileUpload.baseUrl}/chat/upload_file`,
      headers: {
        Authorization: `Bearer ${llmOptions.fileUpload.token}`,
      },
      data: req, // Use the request stream as the data
      responseType: 'stream', // Handle the response as a stream
    });

    // Pipe the response from the backend API to the client
    response.data.pipe(res);

    // Forward the response headers and status
    response.data.on('end', () => {
      res.writeHead(response.status, response.headers);
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Error forwarding response', error);
      res.status(500).send({ message: 'Error forwarding the response' });
    });
  } catch (error) {
    console.error('Error proxying request', error);
    res.status(500).send({ error: { message: 'Error proxying the request' } });
  }
}
