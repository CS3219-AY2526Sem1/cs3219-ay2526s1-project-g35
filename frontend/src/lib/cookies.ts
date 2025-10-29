/**
 * Cookie utility functions
 */

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

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

/**
 * Get access token from cookie
 */
export function getAccessToken(): string | null {
  return getCookie('accessToken');
}
