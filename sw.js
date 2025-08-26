// 🌐 Service Worker - PWA Support
const CACHE_NAME = 'portal-cache-v1.0.3';
const ASSET_VERSION = '20250811-1700';
const v = (url) => `${url}?v=${ASSET_VERSION}`;
const STATIC_CACHE_URLS = [
    v('/'),
    v('/index.html'),
    v('/dashboard-admin.html'),
    v('/login.html'),
    v('/offline.html'),
    v('/assets/css/main.css'),
    v('/components/portal-components.css'),
    v('/components/portal-components.js'),
    v('/features/portal-professional-features.css'),
    v('/features/portal-professional-features.js'),
    v('/analytics/portal-analytics.js'),
    v('/integrations/portal-integrations.js')
];

// 📦 Install Event - Cache recursos essenciais
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cacheando recursos essenciais');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker: Recursos cacheados com sucesso');
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
    const isScript = event.request.destination === 'script' || url.pathname.endsWith('.js');
    const isStyle = event.request.destination === 'style' || url.pathname.endsWith('.css');

    // Network-first para HTML/JS/CSS
    if (isHTML || isScript || isStyle) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then(r => r || (isHTML ? caches.match('/offline.html') : undefined)))
        );
        return;
    }

    // Cache-first para demais recursos
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return response;
            }))
    );
});

// 🔔 Push Event - Notificações Push
self.addEventListener('push', event => {
    console.log('🔔 Service Worker: Push recebido');
    
    let notificationData = {};
    
    if (event.data) {
        notificationData = event.data.json();
    }
    
    const options = {
        body: notificationData.body || 'Nova notificação do Portal Dr. Marcio',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        data: notificationData.data || {},
        actions: [
            {
                action: 'open',
                title: 'Abrir Portal'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ],
        tag: notificationData.tag || 'portal-notification',
        requireInteraction: notificationData.urgent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(
            notificationData.title || 'Portal Dr. Marcio',
            options
        )
    );
});

// 👆 Notification Click - Ação em notificações
self.addEventListener('notificationclick', event => {
    console.log('👆 Service Worker: Notificação clicada');
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(clientList => {
                    // Se já existe uma aba aberta, focar nela
                    for (const client of clientList) {
                        if (client.url.includes('portal') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Se não, abrir nova aba
                    if (clients.openWindow) {
                        return clients.openWindow('/dashboard-admin.html');
                    }
                })
        );
    }
});

// 📊 Background Sync - Sincronização em background
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Background sync:', event.tag);
    
    if (event.tag === 'sync-appointments') {
        event.waitUntil(syncAppointments());
    }
    
    if (event.tag === 'sync-patient-data') {
        event.waitUntil(syncPatientData());
    }
});

// 🔄 Sync Functions
async function syncAppointments() {
    try {
        // Recuperar dados pendentes do IndexedDB
        const pendingAppointments = await getPendingAppointments();
        
        if (pendingAppointments.length > 0) {
            for (const appointment of pendingAppointments) {
                await syncAppointmentToServer(appointment);
            }
            
            // Notificar sucesso
            self.registration.showNotification('✅ Sincronização Completa', {
                body: `${pendingAppointments.length} agendamentos sincronizados`,
                icon: '/assets/icons/icon-192x192.png'
            });
        }
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
}

async function syncPatientData() {
    try {
        const pendingData = await getPendingPatientData();
        
        for (const data of pendingData) {
            await syncPatientDataToServer(data);
        }
    } catch (error) {
        console.error('❌ Erro na sincronização de pacientes:', error);
    }
}

// 📱 Message Event - Comunicação com a aplicação
self.addEventListener('message', event => {
    console.log('💬 Service Worker: Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(event.data.payload))
        );
    }
});

// 🔧 Utility Functions
async function getPendingAppointments() {
    // Implementar IndexedDB para dados offline
    return [];
}

async function syncAppointmentToServer(appointment) {
    // Implementar sync com Supabase
    return true;
}

async function getPendingPatientData() {
    return [];
}

async function syncPatientDataToServer(data) {
    return true;
}

console.log('🔧 Service Worker: Script carregado');
