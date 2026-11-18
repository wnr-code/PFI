import {build} from 'esbuild';
import {mkdirSync, copyFileSync, readdirSync, writeFileSync, rmSync, readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

function readBuildEnv(){
  const values = { ...process.env };
  // Cloudflare Dashboard build variables take precedence. The tracked file
  // contains only public/publishable frontend configuration for local builds.
  if (existsSync('.env.production')) {
    for (const line of readFileSync('.env.production', 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || values[match[1]]) continue;
      values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return values;
}

async function main(){
  const env = readBuildEnv();
  rmSync('dist',{recursive:true,force:true});
  mkdirSync('dist/assets/fonts',{recursive:true});
  mkdirSync('dist/images',{recursive:true});
  const fileLoader={'.woff2':'file','.webp':'file'};
  await build({
    entryPoints:['src/main.jsx'],outfile:'dist/assets/main.js',bundle:true,format:'esm',minify:true,
    logLevel:'info',target:'es2020',loader:fileLoader,
    define:{
      'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_API_URL':JSON.stringify(env.VITE_API_URL || ''),
    },
  });
  await build({
    entryPoints:['src/styles.css'],outfile:'dist/assets/styles.css',bundle:true,minify:true,logLevel:'info',
    loader:fileLoader,
  });
  for(const f of ['pfi.svg','manifest.webmanifest'])copyFileSync('public/'+f,'dist/'+f);
  for(const f of readdirSync('public/images'))copyFileSync(join('public/images',f),'dist/images/'+f);
  const srcFonts='node_modules/@fontsource-variable/plus-jakarta-sans/files';
  for(const f of readdirSync(srcFonts))if(f.endsWith('.woff2'))copyFileSync(join(srcFonts,f), 'dist/assets/fonts/'+f);
  const html = [
    '<!doctype html>',
    '<html lang="id"><head><meta charset="UTF-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    '<meta name="theme-color" content="#101d36"/>',
    '<meta name="description" content="Ruang observasi digital Pusat Falak Indonesia. Jelajahi fase Bulan, hisab awal bulan, kalender Hijriah, dan komunitas pengamat."/>',
    '<link rel="icon" type="image/svg+xml" href="/pfi.svg"/>',
    '<link rel="manifest" href="/manifest.webmanifest"/>',
    '<title>Beranda · Pusat Falak Indonesia</title>',
    '<link rel="stylesheet" href="/assets/styles.css"/></head>',
    '<body><div id="root"></div><script type="module" src="/assets/main.js"></script></body></html>',
  ].join('\n');
  writeFileSync('dist/index.html', html);
  console.log('Build complete: dist/');
}
main().catch(e=>{console.error(e);process.exit(1);});
