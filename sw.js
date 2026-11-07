// Service worker: permite instalar la app y abrirla aunque se corte la conexión. Siempre intenta la versión más nueva.
const V='legion-v8';
const FILES=['./','index.html','styles.css','app.js','calls.js','ui.js','config.js','icon-192.png','icon-512.png','apple-touch-icon.png','manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||e.request.url.includes('supabase'))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request)));
});
