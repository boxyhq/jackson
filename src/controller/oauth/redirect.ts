export const success = (redirectUrl: string, params: Record<string, string>) => {
  const url = new URL(redirectUrl);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.href;
}