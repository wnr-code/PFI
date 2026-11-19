/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, {
  createContext, useContext, useEffect, useState, useCallback, useRef,
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
  const refreshSequence = useRef(0);
  const signedOutRequested = useRef(false);

  const tell = useCallback((msg) => {
    setToast(msg);
    // Diagnostic messages remain longer so their reference can be copied.
    setTimeout(() => setToast(''), /Kode:\s*\S+/.test(msg) ? 12000 : 4000);
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
    // Invalidate in-flight authenticated refreshes and clear private UI first.
    signedOutRequested.current = true;
    refreshSequence.current += 1;
    session(null);
    go('beranda');
    try {
      await authApi.signOut();
      tell('Anda telah keluar.');
    } catch (error) {
      // Keep the UI signed out; the user explicitly requested local logout.
      tell(error?.message || 'Sesi lokal telah dibersihkan.');
    }
  };

  const refresh = useCallback(async (authEventSession = undefined) => {
    const sequence = ++refreshSequence.current;
    try {
      // Auth events provide the authoritative in-memory session. Only query
      // storage during initial startup or an explicit manual refresh.
      const identity = authEventSession === undefined
        ? (await authApi.getIdentitySession()).data
        : { session: authEventSession };
      const identityToken = identity.session?.access_token || null;
      let serverSession;
      const retryDelays = identityToken ? [0, 300, 900] : [0];
      for (const delay of retryDelays) {
        if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
        if (sequence !== refreshSequence.current) return;
        serverSession = await api('/api/session', 'GET', null, identityToken);
        if (serverSession?.account || !identityToken) break;
      }
      if (sequence !== refreshSequence.current) return;
      const identityUser = identity.session?.user;
      // D1 remains authoritative for roles and preferences. If profile
      // provisioning is briefly delayed, show the verified Google identity
      // immediately while the backend continues enforcing every permission.
      const identityAccount = identityUser?.id && identityUser?.email ? {
        id: identityUser.id,
        email: identityUser.email,
        name: identityUser.user_metadata?.name || identityUser.user_metadata?.full_name || identityUser.email,
        org: '', bio: '', avatarUrl: identityUser.user_metadata?.avatar_url || identityUser.user_metadata?.picture || '', role: 'observer', verification: 'none', reviewNote: '', created: identityUser.created_at || '',
      } : null;
      const account = serverSession?.account ? { ...serverSession.account, avatarUrl: serverSession.account.avatarUrl || identityAccount?.avatarUrl || '' } : identityAccount;
      if (identity.session && !account) {
        throw new Error('Login Google berhasil, tetapi identitas akun tidak lengkap. Silakan pilih akun Google lain.');
      }
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
        const posts = await api('/api/posts', 'GET', null, identityToken);
        await offlineStore('posts', posts);
        if (sequence === refreshSequence.current) setData((d) => ({ ...d, posts }));
      } catch (e) {
        const cached = await offlineGet('posts');
        if (sequence === refreshSequence.current) setData((d) => ({ ...d, posts: cached || [] }));
      }

      if (sequence === refreshSequence.current) setData((d) => ({ ...d, ready: true }));
    } catch (e) {
      if (sequence !== refreshSequence.current) return;
      setData((d) => ({ ...d, account: null, session: null, ready: true }));
      tell(e?.message || 'Sesi Google tidak dapat dimuat. Silakan masuk kembali.');
    }
  }, [tell]);

  useEffect(() => {
    let authRefreshTimer;
    const { data: { subscription } } = authApi.onAuthStateChange((event, authEventSession) => {
      if (signedOutRequested.current && authEventSession) return;
      if (event === 'SIGNED_OUT') {
        clearTimeout(authRefreshTimer);
        signedOutRequested.current = true;
        refreshSequence.current += 1;
        session(null);
        return;
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Supabase recommends using the event's session instead of calling
        // getSession again. Defer API work until its internal auth lock exits.
        clearTimeout(authRefreshTimer);
        authRefreshTimer = setTimeout(
          () => event === 'INITIAL_SESSION' ? refresh() : refresh(authEventSession),
          0
        );
      }
    });

    // Online/offline
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onAuthExpired = () => {
      signedOutRequested.current = true;
      refreshSequence.current += 1;
      session(null);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('pfi:auth-expired', onAuthExpired);

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
      window.removeEventListener('pfi:auth-expired', onAuthExpired);
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
