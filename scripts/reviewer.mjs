/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import{database}from'../server/database.mjs';const email=process.argv[2]?.trim().toLowerCase();if(!email)throw new Error('Usage: npm run reviewer -- <registered-account-email>');const db=database();const r=db.prepare("UPDATE accounts SET role='reviewer' WHERE email=?").run(email);db.close();if(!r.changes)throw new Error('Akun belum terdaftar.');console.log('Peran peninjau diberikan. Muat ulang aplikasi.');
