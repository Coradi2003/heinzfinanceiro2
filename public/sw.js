const CACHE_NAME = 'paty-heinz-studio-v2';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ESCUTA DE REQUISIÇÕES
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. BLINDAGEM SUPABASE: Ignora totalmente (deixa o navegador falar direto com o banco)
  if (url.includes('supabase.co')) return;

  // 2. Ignora o que não é web
  if (!url.startsWith('http')) return;

  // 3. Só mexemos em requisições de LEITURA (GET)
  // Operações de SALVAR (POST, PUT, DELETE) passam direto.
  if (event.request.method !== 'GET') return;

  // Navegação de páginas (Damos prioridade à rede)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Demais arquivos (Ícones, Manifest, Logo)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
