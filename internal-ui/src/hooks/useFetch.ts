import { useEffect, useState } from 'react';

async function parseResponseContent(response: Response) {
  const responseText = await response.text();

  try {
    return responseText.length ? JSON.parse(responseText) : '';
  } catch (err) {
    return responseText;
  }
}

export function useFetch<T>({ url }: { url: string }): {
  data?: T;
  isLoading: boolean;
  error: any;
} {
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const res = await fetch(url);
      setIsLoading(false);
      const resContent = await parseResponseContent(res);

      if (res.ok) {
        const pageToken = res.headers.get('jackson-pagetoken');
        if (pageToken !== null) {
          setData({ ...resContent, pageToken });
        } else {
          setData(resContent);
        }
      } else {
        setError(resContent.error);
      }
    }
    fetchData();
  }, [url]);

  return { data, isLoading, error };
}
