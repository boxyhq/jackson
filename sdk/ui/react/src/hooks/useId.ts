import { useEffect, useState } from 'react';
import htmlIdGenerator from '../utils/htmlIdGenerator';

const useId = (elementType?: string) => {
  const [id, setId] = useState('');

  useEffect(() => {
    const uniqueId = Math.round(Math.random() * 1000000).toString();
    setId(htmlIdGenerator(uniqueId, elementType));
  }, [elementType]);

  return id;
};

export default useId;
