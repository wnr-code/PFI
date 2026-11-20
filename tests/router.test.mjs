import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute, readBrowserRoute, routePath } from '../src/lib/router.js';

test('clean routes use readable paths without hash fragments', () => {
  assert.equal(routePath('profil'), '/profil');
  assert.equal(routePath('/hisab/'), '/hisab');
  assert.equal(routePath('#/komunitas'), '/komunitas');
  assert.equal(normalizeRoute('/u/aep-saepulloh?tab=publik'), 'u/aep-saepulloh');
  assert.equal(routePath(''), '/beranda');
});

test('legacy hash routes are replaced by clean paths without a reload', () => {
  let replaced = '';
  const location = { pathname: '/', search: '?from=old', hash: '#/astronomi' };
  const history = { replaceState: (_state, _title, value) => { replaced = value; } };
  assert.equal(readBrowserRoute(location, history), 'astronomi');
  assert.equal(replaced, '/astronomi?from=old');
});

test('direct clean paths survive browser refresh routing', () => {
  const location = { pathname: '/kalkulator', search: '', hash: '' };
  assert.equal(readBrowserRoute(location, null), 'kalkulator');
});
