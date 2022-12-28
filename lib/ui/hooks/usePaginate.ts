import { useState } from 'react';

const usePaginate = () => {
  const [paginate, setPaginate] = useState({ offset: 0 });

  return {
    paginate,
    setPaginate,
  };
};

export default usePaginate;
