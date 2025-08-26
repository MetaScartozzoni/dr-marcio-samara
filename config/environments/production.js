// 🌍 Configuração de Ambiente - Produção
export const productionConfig = {
    // Supabase
    supabase: {
        url: 'https://obohdaxvawmjhxsjgikp.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    
    // URLs
    api: {
        baseUrl: 'https://portal.marcioplasticsurgery.com/api',
        timeout: 10000
    },
    
    // Features
    features: {
        debugging: false,
        analytics: true,
        emailVerification: true,
        smsNotifications: true,
        backupSystem: true
    },
    
    // Cache
    cache: {
        ttl: 3600, // 1 hora
        enabled: true,
        redis: {
            url: 'redis://production-redis:6379'
        }
    },
    
    // Logs
    logging: {
        level: 'error',
        console: false,
        file: true,
        sentry: {
            dsn: 'https://your-sentry-dsn.ingest.sentry.io/project-id'
        }
    },
    
    // Segurança
    security: {
        rateLimiting: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100 // máximo 100 requests
        },
        cors: {
            origin: ['https://portal.marcioplasticsurgery.com'],
            credentials: true
        }
    }
};
