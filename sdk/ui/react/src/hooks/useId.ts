import { useEffect, useRef, useState } from 'react';
import htmlIdGenerator from '../utils/htmlIdGenerator';

const useId = (elementType?: string) => {
  const idRef = useRef(Math.round(Math.random() * 1000000).toString());
  const [id, setId] = useState('');

  useEffect(() => {
    setId(htmlIdGenerator(idRef.current, elementType));
  }, [elementType]);

  return id;
};

export default useId;
