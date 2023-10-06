// returns the cookie with the given name,
// or undefined if not found
export function getErrorCookie() {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + 'jackson_error'.replace(/([.$?*|{}()[]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export const fetcher = async (url: string, queryParams = '') => {
  const res = await fetch(`${url}${queryParams}`);

  let resContent, pageToken;

  try {
    resContent = await res.clone().json();
    pageToken = res.headers.get('jackson-pagetoken');
    if (pageToken !== null) {
      return { ...resContent, pageToken };
    }
  } catch (e) {
    resContent = await res.clone().text();
  }

  if (!res.ok) {
    const error = new Error(
      (resContent.error.message as string) || 'An error occurred while fetching the data.'
    );

    throw error;
  }

  return resContent;
};

/** Check if object is empty ({}) https://stackoverflow.com/a/32108184 */
export const isObjectEmpty = (obj) =>
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  obj && // 👈 null and undefined check
  Object.keys(obj).length === 0 &&
  Object.getPrototypeOf(obj) === Object.prototype;
