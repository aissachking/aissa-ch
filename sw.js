const C="aissa-ch-v3-fx1",F=["./", "index.html", "styles.css", "data.js", "app.js", "fx.css", "fx.js", "vendor/motion.js", "img/portrait-1200.webp", "manifest.webmanifest", "img/emblem.webp", "img/logo-full.webp", "img/avatar.webp", "img/zad/home.webp", "img/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).catch(()=>{}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))))});
