import { readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const list=async (path,prefix='')=>(await Promise.all((await readdir(path,{withFileTypes:true})).map(e=>e.isDirectory()?list(path+'/'+e.name,prefix+e.name+'/'):prefix+e.name))).flat();
const assets=(await list('dist','/')).filter(x=>x!='/sw.js');
const cache='pfi-'+createHash('sha256').update(assets.join('|')).digest('hex').slice(0,12);
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(${JSON.stringify(assets)})).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pfi-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===location.origin)e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)).catch(()=>e.request.mode==='navigate'?caches.match('/index.html'):Response.error()));});`);
console.log(`Offline cache ready: ${assets.length} local assets.`);
