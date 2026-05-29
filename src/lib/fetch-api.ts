/** Client-side fetch that always sends session cookies to API routes. */
export function fetchApi(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}
