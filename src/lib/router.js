/* Clean-path routing helpers for the PFI single-page application. */
export function normalizeRoute(value) {
  const raw = String(value || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^#\/?/, '')
    .split(/[?#]/, 1)[0]
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/');
  return raw || 'beranda';
}

export function routePath(value) {
  return `/${normalizeRoute(value)}`;
}

export function readBrowserRoute(browserLocation = globalThis.location, browserHistory = globalThis.history) {
  const legacyHash = String(browserLocation?.hash || '');
  if (/^#\/?[^#]/.test(legacyHash)) {
    const route = normalizeRoute(legacyHash);
    browserHistory?.replaceState?.({}, '', `${routePath(route)}${browserLocation?.search || ''}`);
    return route;
  }
  return normalizeRoute(browserLocation?.pathname || '/beranda');
}
