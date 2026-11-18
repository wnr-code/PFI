import React, {
  createContext, useContext, useEffect, useState, useRef, useCallback,
} from 'react';
import { supabase, isAuthConfigured } from './lib/supabase.js';
import {
  authApi, api, offlineStore, offlineGet,
} from './lib/api.js';

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
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);

  const tell = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }, []);

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
      const { data: { session } } = await supabase.auth.getSession();
      const account = session?.user
        ? {
            id: session.user.id,
            name: session.user.user_metadata?.name ?? session.user.email,
            email: session.user.email,
            role: 'observer',
            org: '',
            verification: 'none',
          }
        : null;
      setData((d) => ({ ...d, account, session }));

      // Authorization roles and verification status must come from D1 via the
      // Worker, never from editable Supabase user metadata.
      if (session?.user) {
        try {
          const serverSession = await api('/api/session');
          setData((d) => ({
            ...d,
            account: serverSession.account || account,
            groups: serverSession.groups || [],
            calculations: serverSession.history || [],
            prefs: serverSession.prefs || {},
          }));
        } catch {
          // Keep the conservative observer fallback if the profile API is unavailable.
        }
      }

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
      setData((d) => ({ ...d, ready: true }));
    }
  }, []);

  useEffect(() => {
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refresh();
      } else if (event === 'SIGNED_OUT') {
        session(null);
        setData((d) => ({ ...d, posts: [] }));
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

  const value = {
    data,
    update,
    toggle,
    route,
    lang: data.lang,
    setLang: (l) => update({ lang: l }),
    mode: data.mode,
    setMode: (m) => update({ mode: m }),
    site: data.site,
    setSite: (s) => update({ site: s }),
    t,
    tell,
    toast,
    ready,
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
