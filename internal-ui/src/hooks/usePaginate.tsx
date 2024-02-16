import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export const usePaginate = () => {
  const router = useRouter();

  const offset = router.query.offset ? Number(router.query.offset) : 0;

  const [paginate, setPaginate] = useState({ offset });
  const [pageTokenMap, setPageTokenMap] = useState({});

  useEffect(() => {
    // Prevent pushing the same URL to the history
    if (offset === paginate.offset) {
      return;
    }

    const path = router.asPath.split('?')[0];

    router.push(`${path}?offset=${paginate.offset}`, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginate]);

  useEffect(() => {
    setPaginate({ offset });
  }, [offset]);

  return {
    paginate,
    setPaginate,
    pageTokenMap,
    setPageTokenMap,
  };
};
