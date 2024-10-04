import { useEffect, useState } from 'react';

function useFeatures() {
  const [features, setFeatures] = useState<{ [key: string]: boolean } | null>(null);
  useEffect(() => {
    const fetchChatFeatureStatus = async () => {
      try {
        const response = await fetch('/api/admin/features');
        const { data } = await response.json();
        setFeatures(data.features);
      } catch (error) {
        console.error('Error fetching list of features', error);
      }
    };

    fetchChatFeatureStatus();
  }, []);

  return features;
}

export default useFeatures;
