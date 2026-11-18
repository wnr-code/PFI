// PFI — Pusat Falak Indonesia | Maintainer: @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Project support: https://trakteer.id/lanteraku/tip
// AI-assisted implementation; reviewed and maintained by the project maintainer.
import { supabase } from './supabase.js';

// API is same-origin on Cloudflare Workers. Set VITE_API_URL only when the API
// is intentionally hosted on a separate origin.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const apiUrl = (path) => `${API_BASE}${path}`;

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function apiBlob(path) {
  const token = await getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(apiUrl(path), { headers, credentials: 'same-origin' });
  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Sesi kadaluarsa, silakan masuk kembali.');
  }
  if (!res.ok) throw new Error(`Foto tidak dapat dimuat (HTTP ${res.status}).`);
  return res.blob();
}

export async function api(path, method = 'GET', body = null) {
  const token = await getToken();
  const headers = { Accept: 'application/json' };
  if (body !== null && body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body === null || body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    credentials: 'same-origin',
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    throw new Error('Sesi kadaluarsa, silakan masuk kembali.');
  }

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message = typeof payload === 'object' && payload?.error
      ? payload.error
      : `Permintaan gagal (HTTP ${res.status}).`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return payload;
}

// Auth helpers
export const authApi = {
  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    }),

  signInWithPassword: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email, password, meta = {}) =>
    supabase.auth.signUp({ email, password, options: { data: meta } }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback) =>
    supabase.auth.onAuthStateChange(callback),
};

// Offline helpers using IndexedDB
const DB_NAME = 'pfi_offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('posts'))
        db.createObjectStore('posts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('calculations'))
        db.createObjectStore('calculations', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('agendas'))
        db.createObjectStore('agendas', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('groups'))
        db.createObjectStore('groups', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Offline post cache is deliberately public-only: private pending rukyat reports
// must never survive logout or be exposed to another account on a shared device.
export function isPublicOfflinePost(post) {
  return !post?.group && (post?.type !== 'rukyat' || post.status === 'verified');
}

export async function offlineStore(type, items) {
  try {
    const db = await openDB();
    const tx = db.transaction(type, 'readwrite');
    const store = tx.objectStore(type);
    const safeItems = type === 'posts' ? items.filter(isPublicOfflinePost) : items;
    for (const item of safeItems) store.put(item);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Offline store failed:', e.message);
  }
}

export async function offlineGet(type, id = null) {
  try {
    const db = await openDB();
    const tx = db.transaction(type, 'readonly');
    const store = tx.objectStore(type);
    const result = id ? store.get(id) : store.getAll();
    await new Promise((resolve, reject) => {
      result.onsuccess = resolve;
      result.onerror = () => reject(result.error);
    });
    db.close();
    if (type === 'posts') {
      if (id) return result.result && isPublicOfflinePost(result.result) ? result.result : undefined;
      return (result.result || []).filter(isPublicOfflinePost);
    }
    return result.result;
  } catch (e) {
    console.warn('Offline get failed:', e.message);
    return id ? undefined : [];
  }
}
