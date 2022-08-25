import axios from 'axios';
import { getToken } from '../projects';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getProject = async (token: any, id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const config = {
      method: 'get',
      url: `${process.env.RETRACED_HOST}/admin/v1/project/${id}`,
      headers: {
        Authorization: `id=${token.id} token=${token.token}`,
      },
    };

    axios(config)
      .then(function (response) {
        resolve({
          ...response.data,
          url: `${process.env.RETRACED_HOST}/admin/v1/project/${id}/event`,
        });
      })
      .catch(function (error) {
        reject(error);
      });
  });
};

export default async function handler(req, res) {
  const { id } = req.query;
  const token = await getToken();
  if (req.method === 'POST') {
    res.status(404).json({
      message: 'Not Allowed!',
    });
  } else {
    const projects = await getProject(token, id);
    res.status(200).json(projects);
  }
}
