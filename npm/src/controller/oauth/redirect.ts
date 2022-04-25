export const success = (
  redirectUrl: string,
  params: Record<string, string | string[] | undefined>
): string => {
  const url: URL = new URL(redirectUrl);

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url.href;
};
