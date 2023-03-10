import axios from 'axios';

const retry = 3;
const retryDelay = 3000;
const axiosInstance = axios.create();

// Axios interceptors to handle the Webhook retries
axiosInstance.interceptors.response.use(undefined, (err: any) => {
  const config = err.config;

  if (!config) {
    return Promise.reject(err);
  }

  config.__retryCount = config.__retryCount || 0;

  if (config.__retryCount >= retry) {
    return Promise.reject(err);
  }

  config.__retryCount += 1;

  const backoff = new Promise(function (resolve) {
    setTimeout(function () {
      resolve(1);
    }, retryDelay);
  });

  return backoff.then(function () {
    console.info(`Retrying sending webhook event to ${config.url}... Attempt ${config.__retryCount}`);
    return axiosInstance(config);
  });
});

export default axiosInstance;
