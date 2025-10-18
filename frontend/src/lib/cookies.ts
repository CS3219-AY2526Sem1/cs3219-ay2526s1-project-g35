/**
 * Cookie utility functions
 */

/**
 * Check if a cookie exists by name
 */
export function hasCookie(name: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const cookies = document.cookie.split(';');
  return cookies.some((cookie) => {
    const [cookieName] = cookie.trim().split('=');
    return cookieName === name;
  });
}

/**
 * Check if user has access token
 */
export function hasAccessToken(): boolean {
  return hasCookie('accessToken');
}
