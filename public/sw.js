const CACHE_NAME = 'metronome-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 这是一个基础的 fetch 拦截器。
  // 它的存在是为了满足 Android Chrome 生成独立 PWA (WebAPK) 的强制要求。
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline mode not fully implemented, but app is installed.');
    })
  );
});
