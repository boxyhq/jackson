import { useEffect, useState } from 'react';

function useFeatures() {
  const [features, setFeatures] = useState<{ [key: string]: boolean } | null>(null);
  useEffect(() => {
    const fetchLLMVaultFeatureStatus = async () => {
      try {
        const response = await fetch('/api/admin/features');
        const { data } = await response.json();
        setFeatures(data.features);
      } catch (error) {
        console.error('Error fetching list of features', error);
      }
    };

    fetchLLMVaultFeatureStatus();
  }, []);

  return features;
}

export default useFeatures;
