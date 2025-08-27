// 🌐 Service Worker - PWA Support for React
const CACHE_NAME = 'portal-cache-v1.0.4';
const ASSET_VERSION = '20250811-1800';

// 📦 Install Event - Cache recursos essenciais
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cache básico instalado');
                return self.skipWaiting();
            })
    );
});

// 🔄 Activate Event - Limpar caches antigos
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Ativando...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                        return Promise.resolve();
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Ativado com sucesso');
                return self.clients.claim();
            })
    );
});

// 📡 Fetch Event - Interceptar requests
self.addEventListener('fetch', event => {
    // Apenas interceptar requests GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isHTML = event.request.destination === 'document' || url.pathname.endsWith('.html');

    // 🚨 CRÍTICO: Para React Router - rotas SPA
    // Se for uma rota de navegação, sempre retornar index.html
    if (isHTML && url.origin === self.location.origin) {
        // Lista de rotas que são do React Router
        const reactRoutes = ['/register', '/login', '/dashboard', '/admin', '/funcionario'];

        const isReactRoute = reactRoutes.some(route =>
            url.pathname === route ||
            url.pathname.startsWith(route + '/') ||
            (!url.pathname.includes('.') && url.pathname !== '/' && url.pathname !== '/index.html')
        );

        if (isReactRoute) {
            console.log('🔄 Service Worker: Rota React detectada:', url.pathname);
            event.respondWith(
                caches.match('/index.html')
                    .then(response => response || fetch('/index.html'))
                    .catch(() => fetch('/index.html'))
            );
            return;
        }
    }

    // Para outros recursos, tentar cache primeiro, depois rede
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    return cached;
                }

                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses
                        if (response && response.status === 200 && response.type === 'basic') {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return offline page for HTML requests
                        if (isHTML) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

console.log('🔧 Service Worker: Script carregado e corrigido para React');
