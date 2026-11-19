/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import {build} from 'esbuild';
import {mkdirSync, copyFileSync, readdirSync, writeFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';

async function main(){
  rmSync('dist',{recursive:true,force:true});
  mkdirSync('dist/assets/fonts',{recursive:true});
  mkdirSync('dist/images',{recursive:true});
  const fileLoader={'.woff2':'file','.webp':'file'};
  const define={
    'import.meta.env.PROD':'true',
    'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(process.env.VITE_SUPABASE_URL||'https://boennhvuoptogvcocbpx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY||'sb_publishable_hM2Sdb3-WgLzc6-tgKc9Yg_wRyEHMtW'),
    'import.meta.env.VITE_API_URL':JSON.stringify(process.env.VITE_API_URL||''),
  };
  await build({
    entryPoints:{main:'src/main.jsx'},outdir:'dist/assets',bundle:true,format:'esm',splitting:true,minify:true,
    chunkNames:'chunks/[name]-[hash]',logLevel:'info',target:'es2020',loader:fileLoader,define,
  });
  await build({
    entryPoints:['src/styles.css'],outfile:'dist/assets/styles.css',bundle:true,minify:true,logLevel:'info',
    loader:fileLoader,
  });
  for(const f of ['pfi.svg','manifest.webmanifest'])copyFileSync('public/'+f,'dist/'+f);
  for(const f of readdirSync('public/images'))copyFileSync(join('public/images',f),'dist/images/'+f);
  const srcFonts='node_modules/@fontsource-variable/plus-jakarta-sans/files';
  for(const f of readdirSync(srcFonts))if(f.endsWith('.woff2'))copyFileSync(join(srcFonts,f),'dist/assets/fonts/'+f);
  writeFileSync('dist/index.html',`<!doctype html>
<html lang="id"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="theme-color" content="#101d36"/><meta name="description" content="Ruang observasi digital Pusat Falaq Indonesia. Jelajahi fase Bulan, hisab awal bulan, kalender Hijriah, dan komunitas pengamat."/><link rel="icon" type="image/svg+xml" href="/pfi.svg"/><link rel="manifest" href="/manifest.webmanifest"/><title>Beranda · Pusat Falaq Indonesia</title><link rel="stylesheet" href="/assets/styles.css"/></head><body><div id="root"></div><script type="module" src="/assets/main.js"></script></body></html>`);
  console.log('Build complete: dist/');
}
main().catch(e=>{console.error(e);process.exit(1);});
