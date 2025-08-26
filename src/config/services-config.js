const fs = require('fs');
const path = require('path');

class ServicesConfig {
    constructor() {
        this.configFile = path.join(__dirname, '../../config', 'services.json');
        this.config = this.loadConfig();
    }

    // Configuração padrão do sistema
    getDefaultConfig() {
        return {
            services: {
                email: {
                    enabled: false,
                    configured: false,
                    provider: 'sendgrid',
                    credentials: null
                },
                sms: {
                    enabled: false,
                    configured: false,
                    provider: 'twilio',
                    credentials: null
                },
                payments: {
                    enabled: false,
                    configured: false,
                    providers: {
                        stripe: {
                            enabled: false,
                            configured: false,
                            credentials: null
                        },
                        pagseguro: {
                            enabled: false,
                            configured: false,
                            credentials: null
                        }
                    }
                },
                whatsapp: {
                    enabled: false,
                    configured: false,
                    provider: 'whatsapp-business',
                    credentials: null
                },
                database: {
                    enabled: true,
                    configured: true,
                    provider: 'postgresql'
                },
                storage: {
                    enabled: true,
                    configured: true,
                    provider: 'local'
                }
            },
            features: {
                lgpd: true,
                billing: true,
                reports: true,
                notifications: true
            },
            environment: {
                mode: 'development',
                debug: true,
                logging: true
            },
            lastUpdated: new Date().toISOString()
        };
    }

    // Carregar configuração
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const configData = fs.readFileSync(this.configFile, 'utf8');
                const config = JSON.parse(configData);
                console.log('✅ Configuração carregada de:', this.configFile);
                return config;
            } else {
                console.log('📝 Criando configuração padrão...');
                const defaultConfig = this.getDefaultConfig();
                this.saveConfig(defaultConfig);
                return defaultConfig;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configuração, usando padrão:', error);
            return this.getDefaultConfig();
        }
    }

    // Obter configuração (versão async para compatibilidade com API)
    async getConfiguration() {
        return Promise.resolve(this.config);
    }

    // Auto-detectar configurações baseadas em variáveis de ambiente
    autoDetectConfigurations() {
        console.log('🔍 Auto-detectando configurações...');
        
        // SendGrid
        if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
            this.config.services.email.configured = true;
            console.log('✅ SendGrid detectado');
        }
        
        // Twilio
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.config.services.sms.configured = true;
            console.log('✅ Twilio detectado');
        }
        
        // Stripe
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
            this.config.services.payments.providers.stripe.configured = true;
            console.log('✅ Stripe detectado');
        }
        
        // PagSeguro
        if (process.env.PAGSEGURO_EMAIL && process.env.PAGSEGURO_TOKEN) {
            this.config.services.payments.providers.pagseguro.configured = true;
            console.log('✅ PagSeguro detectado');
        }
        
        // WhatsApp
        if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
            this.config.services.whatsapp.configured = true;
            console.log('✅ WhatsApp detectado');
        }
        
        // Atualizar configuração geral de pagamentos
        const stripeReady = this.config.services.payments.providers.stripe.configured;
        const pagseguroReady = this.config.services.payments.providers.pagseguro.configured;
        if (stripeReady || pagseguroReady) {
            this.config.services.payments.configured = true;
            console.log('✅ Serviços de pagamento detectados');
        }
        
        this.saveConfig();
    }

    // Salvar configuração
    saveConfig(config = this.config) {
        try {
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            console.log('✅ Configuração salva em:', this.configFile);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar configuração:', error);
            return false;
        }
    }

    // Verificar se um serviço está habilitado e configurado
    isServiceReady(serviceName, provider = null) {
        const service = this.config.services[serviceName];
        if (!service) return false;
        
        if (provider && service.providers) {
            const providerConfig = service.providers[provider];
            return providerConfig?.enabled && providerConfig?.configured;
        }
        
        return service.enabled && service.configured;
    }

    // Habilitar/desabilitar um serviço
    toggleService(serviceName, enabled, provider = null) {
        if (provider && this.config.services[serviceName]?.providers) {
            this.config.services[serviceName].providers[provider].enabled = enabled;
        } else if (this.config.services[serviceName]) {
            this.config.services[serviceName].enabled = enabled;
        }
        
        this.saveConfig();
        console.log(`${enabled ? '✅' : '❌'} Serviço ${serviceName}${provider ? `/${provider}` : ''} ${enabled ? 'habilitado' : 'desabilitado'}`);
    }

    // Marcar serviço como configurado
    markConfigured(serviceName, configured = true, provider = null) {
        if (provider && this.config.services[serviceName]?.providers) {
            this.config.services[serviceName].providers[provider].configured = configured;
        } else if (this.config.services[serviceName]) {
            this.config.services[serviceName].configured = configured;
        }
        
        this.saveConfig();
        console.log(`Configuração ${serviceName} marcada como ${configured ? 'configurada' : 'não configurada'}`);
    }

    // Método para alternar serviço (versão async para API)
    async toggleServiceAsync(serviceName, enabled) {
        try {
            const config = await this.getConfiguration();
            
            if (!config.services[serviceName]) {
                return { success: false, message: `Serviço ${serviceName} não encontrado` };
            }
            
            config.services[serviceName].enabled = enabled;
            await this.saveConfiguration(config);
            
            return { success: true, message: `Serviço ${serviceName} ${enabled ? 'habilitado' : 'desabilitado'}` };
        } catch (error) {
            return { success: false, message: `Erro ao alterar serviço: ${error.message}` };
        }
    }

    // Método para atualizar configuração completa
    async updateConfiguration(newConfig) {
        try {
            // Mesclar com configuração existente
            const currentConfig = await this.getConfiguration();
            const mergedConfig = this.mergeConfigurations(currentConfig, newConfig);
            
            // Validar configuração
            const validation = this.validateConfiguration(mergedConfig);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }
            
            await this.saveConfiguration(mergedConfig);
            return { success: true, config: mergedConfig };
        } catch (error) {
            return { success: false, message: `Erro ao atualizar configuração: ${error.message}` };
        }
    }

    // Método para configurar credenciais de um serviço
    async configureService(serviceName, credentials) {
        try {
            const config = await this.getConfiguration();
            
            if (!config.services[serviceName]) {
                return { success: false, message: `Serviço ${serviceName} não encontrado` };
            }
            
            // Validar credenciais específicas do serviço
            const validation = this.validateServiceCredentials(serviceName, credentials);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }
            
            // Atualizar credenciais (criptografadas)
            config.services[serviceName].credentials = this.encryptCredentials(credentials);
            config.services[serviceName].configured = true;
            config.services[serviceName].lastConfigured = new Date().toISOString();
            
            await this.saveConfiguration(config);
            return { success: true };
        } catch (error) {
            return { success: false, message: `Erro ao configurar serviço: ${error.message}` };
        }
    }

    // Método para salvar configuração (versão async)
    async saveConfiguration(config) {
        return new Promise((resolve, reject) => {
            try {
                const configDir = path.dirname(this.configFile);
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }
                
                fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
                this.config = config; // Atualizar cache local
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Método para mesclar configurações
    mergeConfigurations(current, newConfig) {
        const merged = JSON.parse(JSON.stringify(current)); // Deep clone
        
        // Mesclar serviços
        if (newConfig.services) {
            for (const [serviceName, serviceConfig] of Object.entries(newConfig.services)) {
                if (merged.services[serviceName]) {
                    merged.services[serviceName] = { ...merged.services[serviceName], ...serviceConfig };
                } else {
                    merged.services[serviceName] = serviceConfig;
                }
            }
        }
        
        // Mesclar funcionalidades
        if (newConfig.features) {
            merged.features = { ...merged.features, ...newConfig.features };
        }
        
        // Mesclar ambiente
        if (newConfig.environment) {
            merged.environment = { ...merged.environment, ...newConfig.environment };
        }
        
        return merged;
    }

    // Método para validar configuração
    validateConfiguration(config) {
        try {
            // Validar estrutura básica
            if (!config.services || !config.features || !config.environment) {
                return { valid: false, message: 'Estrutura de configuração inválida' };
            }
            
            // Validar tipos de ambiente
            const validModes = ['development', 'production'];
            if (!validModes.includes(config.environment.mode)) {
                return { valid: false, message: 'Modo de ambiente inválido' };
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, message: `Erro na validação: ${error.message}` };
        }
    }

    // Método para validar credenciais específicas
    validateServiceCredentials(serviceName, credentials) {
        const validators = {
            email: (creds) => {
                if (!creds.apiKey || !creds.fromEmail) {
                    return { valid: false, message: 'API Key e Email são obrigatórios para SendGrid' };
                }
                return { valid: true };
            },
            sms: (creds) => {
                if (!creds.accountSid || !creds.authToken) {
                    return { valid: false, message: 'Account SID e Auth Token são obrigatórios para Twilio' };
                }
                return { valid: true };
            },
            payments: (creds) => {
                const hasStripe = creds.stripe && creds.stripe.publicKey && creds.stripe.secretKey;
                const hasPagSeguro = creds.pagseguro && creds.pagseguro.email && creds.pagseguro.token;
                
                if (!hasStripe && !hasPagSeguro) {
                    return { valid: false, message: 'Pelo menos um provedor de pagamento deve ser configurado' };
                }
                return { valid: true };
            },
            whatsapp: (creds) => {
                if (!creds.phoneNumberId || !creds.accessToken) {
                    return { valid: false, message: 'Phone Number ID e Access Token são obrigatórios para WhatsApp' };
                }
                return { valid: true };
            }
        };
        
        const validator = validators[serviceName];
        if (!validator) {
            return { valid: false, message: `Validador não encontrado para ${serviceName}` };
        }
        
        return validator(credentials);
    }

    // Método para criptografar credenciais (implementação básica)
    encryptCredentials(credentials) {
        // Em produção, use uma biblioteca de criptografia robusta
        // Por enquanto, apenas uma implementação básica
        try {
            const crypto = require('crypto');
            const algorithm = 'aes-256-cbc';
            const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipher(algorithm, key);
            let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return { encrypted, iv: iv.toString('hex') };
        } catch (error) {
            console.warn('Erro na criptografia, salvando sem criptografar:', error.message);
            return credentials; // Fallback sem criptografia
        }
    }

    // Método para descriptografar credenciais
    decryptCredentials(encryptedData) {
        if (!encryptedData.encrypted) {
            return encryptedData; // Não estava criptografado
        }
        
        try {
            const crypto = require('crypto');
            const algorithm = 'aes-256-cbc';
            const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
            
            const decipher = crypto.createDecipher(algorithm, key);
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        } catch (error) {
            console.warn('Erro na descriptografia:', error.message);
            return encryptedData; // Retorna os dados como estão
        }
    }
}

module.exports = ServicesConfig;
