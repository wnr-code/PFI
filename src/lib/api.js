/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import { initializeIdentity, supabase } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function accessToken() {
  // Every authenticated API call must wait for a possible PKCE callback.
  // This also protects calls made outside the initial Provider refresh.
  await initializeIdentity();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function api(path, method = 'GET', body = null) {
  const token = await accessToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = { 'X-PFI-Request': 'workspace' };
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();
  if (res.status === 401) throw new Error('Sesi Google berakhir. Silakan masuk kembali.');
  if (!res.ok) {
    const message = payload?.error || payload?.message || `Permintaan gagal (${res.status})`;
    const detail = payload?.detail ? ` ${payload.detail}` : '';
    const reference = payload?.requestId ? ` Kode: ${payload.code || 'ERROR'} · Referensi: ${payload.requestId}` : '';
    throw new Error(`${message}${detail}${reference}`);
  }
  return payload;
}

// Supabase handles Google identity only. The Cloudflare API validates the Bearer token.
export const authApi = {
  signInWithGoogle: () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  }),
  signOut: async () => {
    // PFI uses bearer tokens only; ending the local identity session is enough
    // and remains reliable even when the provider's global revoke is unavailable.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
  getIdentitySession: async () => {
    await initializeIdentity();
    return supabase.auth.getSession();
  },
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),
};

const DB_NAME = 'pfi_offline';
const DB_VERSION = 1;
function openDB() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, DB_VERSION); request.onupgradeneeded = (event) => { const db = event.target.result; for (const type of ['posts', 'calculations', 'agendas', 'groups']) if (!db.objectStoreNames.contains(type)) db.createObjectStore(type, { keyPath: 'id' }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
function transactionDone(tx) { return new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); }
export async function offlineStore(type, items) { try { const db = await openDB(); const tx = db.transaction(type, 'readwrite'); const store = tx.objectStore(type); for (const item of items) store.put(item); await transactionDone(tx); db.close(); } catch (error) { console.warn('Offline store failed:', error.message); } }
export async function offlineGet(type, id = null) { try { const db = await openDB(); const tx = db.transaction(type, 'readonly'); const request = id ? tx.objectStore(type).get(id) : tx.objectStore(type).getAll(); const result = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); db.close(); return result; } catch (error) { console.warn('Offline get failed:', error.message); return id ? undefined : []; } }
