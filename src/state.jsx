/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { supabase, isAuthConfigured } from './lib/supabase.js';
import {
  authApi, api, offlineStore, offlineGet,
} from './lib/api.js';
import { SITES, agenda } from './lib/astro.js';

const C = createContext(null);

export function usePFI() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('usePFI must be used inside Provider');
  return ctx;
}

const blank = () => ({
  account: null,
  session: null,
  lang: 'id',
  mode: 'pemula',
  site: 'tasik',
  notify: true,
  posts: [],
  groups: [],
  agendas: [],
  calculations: [],
  toast: '',
  ready: false,
  online: true,
});

export function go(path) {
  const value = `#/${path.replace(/^[/#]+/, '')}`;
  if (location.hash !== value) location.hash = value;
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function Provider({ children }) {
  const [data, setData] = useState(blank());
  const [route, setRoute] = useState(
    () => location.hash.replace(/^#\/?/, '') || 'beranda'
  );
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(true);

  const tell = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

  const setPreference = useCallback(async (field, value) => {
    let previous;
    setData((current) => { previous = current[field]; return { ...current, [field]: value }; });
    try { await api('/api/preferences', 'PUT', { [field]: value }); }
    catch (error) {
      setData((current) => ({ ...current, [field]: previous }));
      tell(error.message || 'Pengaturan gagal disimpan.');
    }
  }, [tell]);

  const session = useCallback((s) => {
    setData((d) => ({ ...d, account: s?.account ?? null, session: s?.session ?? null }));
  }, []);

  const update = useCallback((patch) => {
    setData((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) }));
  }, []);

  const signIn = async (s) => {
    session(s);
    await refresh();
    tell('Selamat datang, ' + (s.account?.name ?? '').split(' ')[0] + '.');
  };

  const logout = async () => {
    await authApi.signOut();
    session(null);
    await refresh();
    tell('Anda telah keluar.');
  };

  const refresh = useCallback(async () => {
    try {
      const { data: identity } = await authApi.getIdentitySession();
      const serverSession = await api('/api/session');
      const account = serverSession?.account ?? null;
      const prefs = serverSession?.prefs && typeof serverSession.prefs === 'object' ? serverSession.prefs : {};
      setData((d) => ({
        ...d, account, session: identity.session ?? null,
        lang: ['id', 'en'].includes(prefs.lang) ? prefs.lang : d.lang,
        mode: ['pemula', 'profesional'].includes(prefs.mode) ? prefs.mode : d.mode,
        site: SITES.some((item) => item.id === prefs.site) ? prefs.site : d.site,
        notify: typeof prefs.notify === 'boolean' ? prefs.notify : d.notify,
      }));

      // Fetch posts from API (with offline fallback)
      try {
        const posts = await api('/api/posts');
        await offlineStore('posts', posts);
        setData((d) => ({ ...d, posts }));
      } catch (e) {
        const cached = await offlineGet('posts');
        setData((d) => ({ ...d, posts: cached || [] }));
      }

      setData((d) => ({ ...d, ready: true }));
    } catch (e) {
      setData((d) => ({ ...d, account: null, session: null, ready: true }));
      tell(e?.message || 'Sesi Google tidak dapat dimuat. Silakan masuk kembali.');
    }
  }, [tell]);

  useEffect(() => {
    let authRefreshTimer;
    const { data: { subscription } } = authApi.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        // Supabase warns against calling another auth method from inside this
        // callback. Defer the refresh until its internal auth lock is released.
        clearTimeout(authRefreshTimer);
        authRefreshTimer = setTimeout(() => refresh(), 0);
      }
    });
    // Initial load
    refresh();

    // Online/offline
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Hash routing
    const onHashChange = () => {
      setRoute(location.hash.replace(/^#\/?/, '') || 'beranda');
      setModal(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      clearTimeout(authRefreshTimer);
      subscription?.unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [refresh, session]);

  const open = (type, extra = {}) => setModal({ type, ...extra });
  const close = () => setModal(null);
  const toggle = (field, value) =>
    update((d) => ({
      [field]: d[field]?.includes(value)
        ? d[field].filter((v) => v !== value)
        : [...d[field], value],
    }));

  const t = (id, en) => (data.lang === 'en' ? (en ?? id) : id);

  const loc = SITES.find((item) => item.id === data.site) || SITES[0];
  const events = agenda(new Date(), loc);
  const refreshPosts = refresh;

  const value = {
    data,
    page: route.split('/')[0],
    loc,
    events,
    refreshPosts,
    update,
    toggle,
    route,
    lang: data.lang,
    setLang: (l) => setPreference('lang', l),
    mode: data.mode,
    setMode: (m) => setPreference('mode', m),
    site: data.site,
    setSite: (s) => setPreference('site', s),
    setNotify: (value) => setPreference('notify', value),
    t,
    tell,
    toast,
    ready: data.ready,
    online,
    refresh,
    signIn,
    logout,
    modal,
    open,
    close,
    auth: authApi,
    supabase,
    isAuthConfigured,
  };

  return (
    <C.Provider value={value}>{children}</C.Provider>
  );
}
