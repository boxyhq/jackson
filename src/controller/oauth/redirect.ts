export const success = (
  redirectUrl: string,
  params: Record<string, string>
): string => {
  const url: URL = new URL(redirectUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.href;
};
