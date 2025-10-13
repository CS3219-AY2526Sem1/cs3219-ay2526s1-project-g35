/**
 * Cookie Helper Utility
 * Centralizes cookie configuration to avoid duplication
 */

function secondsToMs(seconds) {
  return parseInt(seconds) * 1000;
}

/**
 * Get standard cookie options from environment variables
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SAME_SITE,
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  };
}

/**
 * Get cookie options for access token
 */
export function getAccessTokenCookieOptions() {
  return {
    ...getCookieOptions(),
    maxAge: secondsToMs(process.env.JWT_EXPIRES_IN),
  };
}

/**
 * Get cookie options for refresh token
 */
export function getRefreshTokenCookieOptions() {
  return {
    ...getCookieOptions(),
    maxAge: secondsToMs(process.env.JWT_REFRESH_EXPIRES_IN),
  };
}

/**
 * Set access token cookie
 */
export function setAccessTokenCookie(res, token) {
  res.cookie("accessToken", token, getAccessTokenCookieOptions());
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(res, token) {
  res.cookie("refreshToken", token, getRefreshTokenCookieOptions());
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(res) {
  const baseOptions = getCookieOptions();
  
  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
}

/**
 * Set both access and refresh token cookies
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
}
