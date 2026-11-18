import React, { useState } from 'react';
import { usePFI } from '../state.jsx';
import { Mail, Lock, Send, MailOpen, UserCheck } from 'lucide-react';

export function AuthModal() {
  const { close, tell, t, auth, lang } = usePFI();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', org: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await auth.signInWithPassword(form.email, form.password);
        if (error) throw error;
      } else {
        const { error } = await auth.signUp(
          form.email,
          form.password,
          { name: form.name, org: form.org }
        );
        if (error) throw error;
        tell(t('Akun dibuat. Silakan cek email untuk verifikasi.', 'Account created. Please check email for verification.'));
      }
      close();
    } catch (e) {
      setErr(e.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setErr('');
    setBusy(true);
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setErr(e.message || 'Login dengan Google gagal.');
    } finally {
      setBusy(false);
    }
  };

  const isDemo = !isAuthConfigured();

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head">
          <div>
            <h2 id="modal-title">
              {mode === 'login' ? t('Masuk ke PFI', 'Sign in to PFI') : t('Daftar akun baru', 'Create a PFI account')}
            </h2>
          </div>
          <button className="close-btn" onClick={() => close()} aria-label={t('Tutup', 'Close')}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {err && (
            <div className="error-msg">{err}</div>
          )}

          <div className="divider"><span>atau</span></div>

          <button
            className="btn-google"
            onClick={signInWithGoogle}
            disabled={busy || isDemo}
          >
            <Send size={18} />
            {busy ? t('Memproses…', 'Processing…') : t('Masuk dengan Google', 'Sign in with Google')}
          </button>
          {isDemo && (
            <p className="demo-note">
              {t('Konfigurasi Supabase belum lengkap. Gunakan tombol di bawah untuk masuk demo.', 'Supabase not configured. Use demo login below.')}
            </p>
          )}

          {!isDemo && (
            <form onSubmit={submit}>
              <div className="field">
                <label>{mode === 'login' ? t('Email', 'Email') : t('Nama lengkap', 'Full name')}</label>
                <input
                  type={mode === 'login' ? 'email' : 'text'}
                  value={form.email}
                  onChange={change('email')}
                  placeholder={mode === 'login' ? 'anda@email.com' : 'Nama Anda'}
                />
              </div>
              {!mode === 'login' && (
                <div className="field">
                  <label>{t('Organisasi (opsional)', 'Organization (optional)')}</label>
                  <input value={form.org} onChange={change('org')} placeholder="Contoh: LAPAN" />
                </div>
              )}
              <div className="field">
                <label>{t('Kata sandi', 'Password')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={change('password')}
                  placeholder="Minimal 10 karakter"
                />
              </div>
              <button
                type="submit"
                className="btn-submit"
                disabled={busy}
              >
                {busy ? t('Memproses…', 'Processing…') : mode === 'login' ? t('Masuk', 'Sign in') : t('Daftar', 'Create account')}
              </button>
            </form>
          )}

          <p className="switch">
            {mode === 'login'
              ? [t('Belum punya akun? ', "Don't have an account? "), <button onClick={() => setMode('register')}>{t('Daftar sekarang', 'Create account')}</button>]
              : [t('Sudah punya akun? ', 'Already have an account? '), <button onClick={() => setMode('login')}>{t('Masuk', 'Sign in')}</button>]}
          </p>

          <p className="demo-footer">
            {t('Demo mode: data disimpan lokal dan akan hilang saat halaman ditutup.', 'Demo mode: data stored locally and will be cleared on close.')}
          </p>
        </div>
      </section>
    </div>
  );
}
