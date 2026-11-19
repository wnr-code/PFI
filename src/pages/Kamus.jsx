/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';
import { usePFI } from '../state.jsx';
import Glossary from '../components/Glossary.jsx';

export default function Kamus() {
  const { t } = usePFI();
  return <div className="page-wrap glossary-page page-enter">
    <header className="science-page-head page-head">
      <div><div className="eyebrow"><i />{t('PANDUAN PEMULA', 'BEGINNER GUIDE')}</div><h1>{t('Kamus Falaq', 'Falaq glossary')}</h1><p>{t('Pelajari istilah hisab, rukyat, hilal, astronomi, dan pengamatan dengan bahasa yang mudah dipahami.', 'Learn calculation, observation, crescent, astronomy, and field terms in plain language.')}</p></div>
      <span className="method-badge"><BookOpen size={16}/>{t('Untuk semua', 'For everyone')}</span>
    </header>
    <div className="glossary-intro"><Lightbulb size={18}/><p>{t('Cari istilah yang belum Anda pahami, lalu tekan judulnya untuk membuka penjelasan. Kamus ini bukan keputusan atau pedoman resmi.', 'Search for an unfamiliar term, then select its title to read the explanation. This glossary is not an official ruling or guideline.')}</p></div>
    <Glossary />
  </div>;
}
