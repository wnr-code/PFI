/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const list=async (path,prefix='')=>(await Promise.all((await readdir(path,{withFileTypes:true})).map(e=>e.isDirectory()?list(path+'/'+e.name,prefix+e.name+'/'):prefix+e.name))).flat();
const assets=(await list('dist','/')).filter(x=>x!='/sw.js').sort();
const fingerprint=createHash('sha256');
for(const asset of assets){fingerprint.update(asset);fingerprint.update(await readFile(`dist${asset}`));}
const cache='pfi-'+fingerprint.digest('hex').slice(0,12);
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(${JSON.stringify(assets)})).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pfi-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy));return r}).catch(()=>caches.match('/index.html')));return}e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok){const copy=n.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return n})));});`);
console.log(`Offline cache ready: ${assets.length} local assets.`);
