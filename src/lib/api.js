import { supabase } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function api(path, method = 'GET', body = null) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token expired or invalid
    const { error } = await supabase.auth.signOut();
    throw new Error('Sesi kadaluarsa, silakan masuk kembali.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
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

export async function offlineStore(type, items) {
  try {
    const db = await openDB();
    const tx = db.transaction(type, 'readwrite');
    const store = tx.objectStore(type);
    for (const item of items) store.put(item);
    await tx.complete;
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
    await new Promise((resolve) => (result.onsuccess = resolve));
    db.close();
    return result.result;
  } catch (e) {
    console.warn('Offline get failed:', e.message);
    return id ? undefined : [];
  }
}
