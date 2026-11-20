/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useEffect, useRef, useState } from 'react';
import { usePFI } from '../state.jsx';
import { LogIn, ShieldCheck } from 'lucide-react';

export function AuthModal() {
  const { close, tell, t, auth, isAuthConfigured } = usePFI();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const buttonRef = useRef(null);
  const configured = isAuthConfigured();

  useEffect(() => {
    buttonRef.current?.focus();
    const escape = (event) => event.key === 'Escape' && close();
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [close]);

  const signIn = async () => {
    setErr('');
    if (!configured) return setErr(t('Google OAuth belum dikonfigurasi pada lingkungan ini.', 'Google OAuth is not configured in this environment.'));
    setBusy(true);
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) throw error;
      tell(t('Mengarahkan ke login Google…', 'Redirecting to Google sign-in…'));
    } catch (error) {
      setErr(error.message || t('Login Google gagal.', 'Google sign-in failed.'));
      setBusy(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <section className="modal auth-google-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-head"><div><span className="eyebrow">PFI · PLATFORM FALAK INDONESIA</span><h2 id="modal-title">{t('Masuk ke PFI', 'Sign in to PFI')}</h2></div><button type="button" className="close-btn" onClick={close} aria-label={t('Tutup dialog', 'Close dialog')}>✕</button></header>
      <div className="modal-body">
        <div className="auth-shield"><ShieldCheck size={28}/></div>
        <p className="auth-intro">{t('Gunakan akun Google untuk masuk dengan cepat dan aman. PFI hanya menerima informasi dasar akun yang diperlukan untuk mengenali Anda.', 'Use your Google account to sign in quickly and securely. PFI only receives the basic account information needed to identify you.')}</p>
        {err && <div className="error-msg" role="alert">{err}</div>}
        <button ref={buttonRef} type="button" className="btn-google" onClick={signIn} disabled={busy || !configured}><LogIn size={19}/>{busy ? t('Menghubungkan…', 'Connecting…') : t('Lanjutkan dengan Google', 'Continue with Google')}</button>
        {!configured && <p className="demo-note">{t('Administrator perlu mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk mengaktifkan Google OAuth.', 'The administrator must configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google OAuth.')}</p>}
        <div className="auth-data-policy"><b>{t('Privasi saat masuk', 'Sign-in privacy')}</b><span>{t('Google digunakan hanya untuk memverifikasi identitas Anda', 'Google is used only to verify your identity')}</span><span>{t('Laporan, foto, dan aktivitas dikelola oleh PFI', 'Reports, photos, and activity are managed by PFI')}</span></div>
        <p className="demo-footer">{t('PFI tidak pernah meminta kata sandi Google Anda.', 'PFI never asks for your Google password.')}</p>
      </div>
    </section>
  </div>;
}
