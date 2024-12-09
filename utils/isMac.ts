export function isMac() {
  const userAgent = window.navigator.userAgent;
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
}
