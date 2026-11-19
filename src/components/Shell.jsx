/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useState } from 'react';
import { usePFI, go } from '../state.jsx';
import {
  House, Calculator, Orbit, UsersRound, UserRound, MapPinned, Files,
  Bell, ChevronRight, MapPin, ChevronDown, GraduationCap, FlaskConical,
  ChevronsUpDown, LayoutDashboard, BookOpen, CreditCard, Share2, LogOut, LogIn,
} from 'lucide-react';
import { SITES } from '../lib/astro.js';

export const navMain = [
  ['beranda', 'Beranda', 'Home', House],
  ['hisab', 'Hisab', 'Hisab', Calculator],
  ['astronomi', 'Astronomi', 'Astronomy', Orbit],
  ['peta', 'Peta', 'Map', MapPinned],
  ['komunitas', 'Komunitas', 'Community', UsersRound],
];

export const navMore = [
  ['peta', 'Peta Rukyat', 'Observation Map', MapPinned],
  ['laporan', 'Pusat Laporan', 'Report Centre', Files],
  ['kamus', 'Kamus Falaq', 'Falaq Glossary', BookOpen],
  ['kalkulator', 'Kalkulator Falaq', 'Falaq Calculator', Calculator],
];

function Observatory() {
  return (
    <svg
      className="sidebar-art"
      viewBox="0 0 230 150"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#607290" strokeWidth=".8">
        <path d="M-12 139 18 122 37 125 64 112 94 123 120 119 151 130 178 119 241 136M-8 148 26 131 61 137 94 129 144 140 175 128 233 144" />
        <path d="M102 125v-28h71v29M96 98h82v-5H96zM101 92a36 36 0 0 1 72 0M109 92c0-17 13-32 28-36M129 92c0-18 4-30 8-36M142 92c0-18-3-30-5-36M161 92c0-15-13-32-24-36M103 79h67M109 70h55M122 60h30M136 55v-6m-3 3h6M110 125v-20h9v20m11 2v-24h11v24m11 0v-22h9v22M86 125v-14l13-9M175 109l16 7v14M84 112l15-13m76 7 19 10" />
        <path d="M9 103Q65 26 191 37" strokeDasharray="2 5" />
        <path d="M22 44 43 30 67 39 80 23" opacity=".6" />
      </g>
      <g fill="#b7a17b">
        <circle cx="22" cy="44" r="1.6" />
        <circle cx="43" cy="30" r="1.5" />
        <circle cx="67" cy="39" r="1" />
        <circle cx="80" cy="23" r="1.7" />
        <path d="m178 18 .8 3.2 3 .8-3 .8-.8 3.2-.8-3.2-3-.8 3-.8zM51 68l.7 2.3 2.5 .7-2.5 .7L51 74l-.7-2.3-2.5-.7 2.5-.7z" />
        {[
          [20, 84], [78, 55], [105, 25], [161, 37], [210, 50], [194, 72],
          [14, 25], [92, 11], [200, 95], [59, 91],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r=".7" />
        ))}
      </g>
    </svg>
  );
}

export function Sidebar() {
  const { page, t, data, setMode } = usePFI();
  const [collapsed, setCollapsed] = useState(false);

  const links = (items) =>
    items.filter(([id]) => data.account || id !== 'komunitas').map(([id, idname, en, I]) => (
      <a
        href={`#/${id}`}
        className={`nav-item ${page === id ? 'active' : ''}`}
        aria-current={page === id ? 'page' : undefined}
        key={id}
        onClick={() => setCollapsed(false)}
      >
        <I size={18} />
        <span>{t(idname, en)}</span>
        {page === id && <i className="active-dot" />}
      </a>
    ));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <a
        className="brand-link"
        href="#/beranda"
        aria-label="Pusat Falaq Indonesia"
        onClick={() => setCollapsed(false)}
      >
        <div className="brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 13A21 21 0 1 0 45 47A21 21 0 0 1 32 13Z" fill="none" stroke="#d6ae62" strokeWidth="2" />
            <path d="M32 33M32 13" fill="none" stroke="#d6ae62" strokeWidth="2" />
            <path d="M32 33M53 33" fill="none" stroke="#d6ae62" strokeWidth="2" />
          </svg>
          <div>
            <span>Pusat Falaq Indonesia</span>
            <small>PFI</small>
          </div>
        </div>
      </a>
      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Buka menu' : 'Tutup menu'}
      >
        {collapsed ? '›' : '‹'}
      </button>
      <nav aria-label={t('Navigasi utama', 'Main navigation')}>
        <div className="nav-label">{t('MENU UTAMA', 'MAIN MENU')}</div>
        {links(navMain)}
      </nav>
      <div className="side-bottom">
        <Observatory />
        <button
          className="mode-button"
          onClick={() => setMode(data.mode === 'pemula' ? 'profesional' : 'pemula')}
        >
          <span className="mode-icon">
            {data.mode === 'pemula' ? (
              <GraduationCap size={16} />
            ) : (
              <FlaskConical size={16} />
            )}
          </span>
          <span>
            <small>{t('PENGALAMAN', 'EXPERIENCE')}</small>
            <b>
              {data.mode === 'pemula'
                ? t('Mode Pemula', 'Beginner Mode')
                : t('Mode Profesional', 'Professional Mode')}
            </b>
          </span>
          <ChevronsUpDown size={12} />
        </button>
        <div className="side-foot">
          <i />
          {t('Ruang observasi digital', 'Digital observatory')}
          <span>v1.0</span>
        </div>
      </div>
    </aside>
  );
}

export function Topbar() {
  const { page, t, data, site, setSite, setNotify, open } = usePFI();
  const entry = [...navMain, ...navMore].find((n) => n[0] === page) || navMain[0];
  const label = t(entry[1], entry[2]);

  return (
    <header className="topbar">
      <div className="crumb">
        <LayoutDashboard size={14} />
        <button onClick={() => go('beranda')}>{t('Ruang Kerja', 'Workspace')}</button>
        <ChevronRight size={12} />
        <strong>{label}</strong>
      </div>
      <div className="top-actions">
        <label className="loc-control" aria-label={t('Lokasi pengamatan', 'Observation site')}>
          <MapPin size={14} />
          <select value={site} onChange={(event) => setSite(event.target.value)}>
            {SITES.map((item) => <option key={item.id} value={item.id}>{item.city}</option>)}
          </select>
        </label>
        <button
          className="bell-button help-button"
          aria-label={t('Buka Kamus Falaq', 'Open Falaq glossary')}
          title={t('Kamus Falaq', 'Falaq glossary')}
          onClick={() => go('kamus')}
        >
          <BookOpen size={17}/>
        </button>
        {data.account && <button
          className="bell-button"
          aria-label={t('Notifikasi', 'Notifications')}
          onClick={() => setNotify(!data.notify)}
        >
          <Bell size={17} />
          {data.notify && <i className="bell-dot" />}
        </button>}
        <button
          className={`account-control ${data.account ? '' : 'signed-out'}`}
          onClick={() => data.account ? go('profil') : open('auth')}
          aria-label={data.account ? t('Buka profil', 'Open profile') : t('Masuk dengan Google', 'Sign in with Google')}
        >
          {data.account
            ? <img src={data.account.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.account.name)}`} alt="" referrerPolicy="no-referrer" />
            : <span className="login-icon"><LogIn size={20} aria-hidden="true" /></span>}
          <b>
            {data.account
              ? data.account.name.split(' ')[0] +
                (data.account.name.split(' ')[1] ? ' ' + data.account.name.split(' ')[1][0] + '.' : '')
              : t('Masuk', 'Sign in')}
          </b>
          <ChevronDown className="account-chevron" size={12} />
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { page, t, data } = usePFI();
  const visibleNavigation = navMain.filter(([id]) => data.account || id !== 'komunitas');
  return (
    <nav className="bottom-nav" aria-label={t('Navigasi bawah', 'Bottom navigation')}>
      {visibleNavigation.map(([id, a, b, I]) => (
        <a
          key={id}
          href={`#/${id}`}
          className={`bottom-item ${page === id ? 'active' : ''}`}
          aria-current={page === id ? 'page' : undefined}
        >
          <I size={22} />
          <span>{t(a, b)}</span>
        </a>
      ))}
    </nav>
  );
}
