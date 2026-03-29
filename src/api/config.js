// Backend server URL
export const API_BASE_URL = 'https://deeplink.gotest24.com/api';

/**
 * Generic fetch wrapper for API calls.
 */
export async function fetchApi(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const { headers: optHeaders, ...restOptions } = options;
  const res = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optHeaders,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${url} ${body}`);
  }
  return res.json();
}
