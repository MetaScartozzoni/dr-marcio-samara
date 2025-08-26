// 🧹 Portal Cache Cleaner - Limpa TODOS os caches
console.log('🧹 Iniciando limpeza completa do cache...');

// Limpar Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            console.log('🗑️ Desregistrando Service Worker:', registration.scope);
            registration.unregister();
        }
    });
}

// Limpar Cache Storage
if ('caches' in window) {
    caches.keys().then(cacheNames => {
        return Promise.all(
            cacheNames.map(cacheName => {
                console.log('🗑️ Deletando cache:', cacheName);
                return caches.delete(cacheName);
            })
        );
    }).then(() => {
        console.log('✅ Todos os caches foram limpos!');
        console.log('🔄 Recarregue a página com Cmd+Shift+R');
        
        // Auto-reload após 2 segundos
        setTimeout(() => {
            window.location.reload(true);
        }, 2000);
    });
} else {
    console.log('⚠️ Cache API não disponível');
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}
