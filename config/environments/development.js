// 🌍 Configuração de Ambiente - Desenvolvimento
export const developmentConfig = {
    // Supabase
    supabase: {
        url: 'http://localhost:54321', // Local Supabase
        anonKey: 'your-local-anon-key',
        serviceRoleKey: 'your-local-service-key'
    },
    
    // URLs
    api: {
        baseUrl: 'http://localhost:3000/api',
        timeout: 5000
    },
    
    // Features
    features: {
        debugging: true,
        analytics: false,
        emailVerification: false,
        smsNotifications: false
    },
    
    // Cache
    cache: {
        ttl: 300, // 5 minutos
        enabled: false
    },
    
    // Logs
    logging: {
        level: 'debug',
        console: true,
        file: false
    }
};
