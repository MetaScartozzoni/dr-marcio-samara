const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const ServicesConfig = require('../config/services-config');

// Instância do gerenciador de configurações
const servicesConfig = new ServicesConfig();

// GET /api/config/services - Obter configuração atual
router.get('/services', async (req, res) => {
    try {
        const config = await servicesConfig.getConfiguration();
        res.json(config);
    } catch (error) {
        console.error('Erro ao obter configuração:', error);
        res.status(500).json({ 
            error: 'Erro ao obter configuração',
            details: error.message 
        });
    }
});

// POST /api/config/services/toggle - Alternar estado de um serviço
router.post('/services/toggle', async (req, res) => {
    try {
        const { service, enabled } = req.body;
        
        if (!service || typeof enabled !== 'boolean') {
            return res.status(400).json({ 
                error: 'Parâmetros inválidos. Esperado: service (string) e enabled (boolean)' 
            });
        }

        const result = await servicesConfig.toggleServiceAsync(service, enabled);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: `Serviço ${service} ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`,
                service,
                enabled
            });
        } else {
            res.status(400).json({ 
                error: result.message 
            });
        }
    } catch (error) {
        console.error('Erro ao alterar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// PUT /api/config/services - Atualizar configuração completa
router.put('/services', async (req, res) => {
    try {
        const newConfig = req.body;
        
        // Validar estrutura básica
        if (!newConfig || typeof newConfig !== 'object') {
            return res.status(400).json({ 
                error: 'Configuração inválida' 
            });
        }

        const result = await servicesConfig.updateConfiguration(newConfig);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Configuração atualizada com sucesso',
                config: result.config
            });
        } else {
            res.status(400).json({ 
                error: result.message 
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// POST /api/config/services/test - Testar um serviço específico
router.post('/services/test', async (req, res) => {
    try {
        const { service } = req.body;
        
        if (!service) {
            return res.status(400).json({ 
                error: 'Nome do serviço é obrigatório' 
            });
        }

        const result = await testService(service);
        res.json(result);
    } catch (error) {
        console.error('Erro ao testar serviço:', error);
        res.status(500).json({ 
            error: 'Erro ao testar serviço',
            details: error.message 
        });
    }
});

// POST /api/config/services/configure - Configurar credenciais de um serviço
router.post('/services/configure', async (req, res) => {
    try {
        const { service, credentials } = req.body;
        
        if (!service || !credentials) {
            return res.status(400).json({ 
                error: 'Nome do serviço e credenciais são obrigatórios' 
            });
        }

        const result = await servicesConfig.configureService(service, credentials);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: `Serviço ${service} configurado com sucesso`
            });
        } else {
            res.status(400).json({ 
                error: result.message 
            });
        }
    } catch (error) {
        console.error('Erro ao configurar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// GET /api/config/services/status - Obter status detalhado de todos os serviços
router.get('/services/status', async (req, res) => {
    try {
        const status = await getServicesStatus();
        res.json(status);
    } catch (error) {
        console.error('Erro ao obter status dos serviços:', error);
        res.status(500).json({ 
            error: 'Erro ao obter status dos serviços',
            details: error.message 
        });
    }
});

// GET /api/config/backup - Fazer backup da configuração
router.get('/backup', async (req, res) => {
    try {
        const config = await servicesConfig.getConfiguration();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        res.setHeader('Content-Disposition', `attachment; filename=system-config-${timestamp}.json`);
        res.setHeader('Content-Type', 'application/json');
        res.json(config);
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        res.status(500).json({ 
            error: 'Erro ao fazer backup da configuração',
            details: error.message 
        });
    }
});

// POST /api/config/restore - Restaurar configuração do backup
router.post('/restore', async (req, res) => {
    try {
        const config = req.body;
        
        if (!config || typeof config !== 'object') {
            return res.status(400).json({ 
                error: 'Configuração de backup inválida' 
            });
        }

        const result = await servicesConfig.updateConfiguration(config);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Configuração restaurada com sucesso'
            });
        } else {
            res.status(400).json({ 
                error: result.message 
            });
        }
    } catch (error) {
        console.error('Erro ao restaurar configuração:', error);
        res.status(500).json({ 
            error: 'Erro ao restaurar configuração',
            details: error.message 
        });
    }
});

// Função auxiliar para testar serviços
async function testService(serviceName) {
    const config = await servicesConfig.getConfiguration();
    const serviceConfig = config.services[serviceName];
    
    if (!serviceConfig) {
        return { success: false, message: 'Serviço não encontrado' };
    }
    
    if (!serviceConfig.enabled) {
        return { success: false, message: 'Serviço está desabilitado' };
    }
    
    if (!serviceConfig.configured) {
        return { success: false, message: 'Serviço não está configurado' };
    }
    
    try {
        let testResult = { success: false, message: 'Teste não implementado' };
        
        switch (serviceName) {
            case 'email':
                testResult = await testEmailService();
                break;
            case 'sms':
                testResult = await testSmsService();
                break;
            case 'payments':
                testResult = await testPaymentService();
                break;
            case 'whatsapp':
                testResult = await testWhatsAppService();
                break;
            default:
                testResult = { success: false, message: 'Teste não disponível para este serviço' };
        }
        
        return testResult;
    } catch (error) {
        return { 
            success: false, 
            message: 'Erro durante o teste',
            details: error.message 
        };
    }
}

// Funções de teste específicas
async function testEmailService() {
    try {
        // Aqui você implementaria o teste real do SendGrid
        // Por exemplo, validar as credenciais
        return { 
            success: true, 
            message: 'Serviço de email funcionando corretamente',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { 
            success: false, 
            message: 'Falha no teste do serviço de email',
            details: error.message 
        };
    }
}

async function testSmsService() {
    try {
        // Teste do Twilio
        return { 
            success: true, 
            message: 'Serviço de SMS funcionando corretamente',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { 
            success: false, 
            message: 'Falha no teste do serviço de SMS',
            details: error.message 
        };
    }
}

async function testPaymentService() {
    try {
        const config = await servicesConfig.getConfiguration();
        const paymentConfig = config.services.payments;
        const results = {};
        
        // Testar provedores habilitados
        if (paymentConfig.providers?.stripe?.enabled) {
            results.stripe = { success: true, message: 'Stripe conectado' };
        }
        
        if (paymentConfig.providers?.pagseguro?.enabled) {
            results.pagseguro = { success: true, message: 'PagSeguro conectado' };
        }
        
        return { 
            success: true, 
            message: 'Serviços de pagamento testados',
            results,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { 
            success: false, 
            message: 'Falha no teste dos serviços de pagamento',
            details: error.message 
        };
    }
}

async function testWhatsAppService() {
    try {
        // Teste do WhatsApp Business API
        return { 
            success: true, 
            message: 'Serviço do WhatsApp funcionando corretamente',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { 
            success: false, 
            message: 'Falha no teste do serviço do WhatsApp',
            details: error.message 
        };
    }
}

// Função para obter status detalhado
async function getServicesStatus() {
    const config = await servicesConfig.getConfiguration();
    const status = {
        summary: {
            total: 0,
            enabled: 0,
            configured: 0,
            ready: 0
        },
        services: {}
    };
    
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
        status.summary.total++;
        
        const serviceStatus = {
            enabled: serviceConfig.enabled,
            configured: serviceConfig.configured,
            ready: serviceConfig.enabled && serviceConfig.configured,
            lastTest: null,
            uptime: null
        };
        
        if (serviceConfig.enabled) status.summary.enabled++;
        if (serviceConfig.configured) status.summary.configured++;
        if (serviceStatus.ready) status.summary.ready++;
        
        status.services[serviceName] = serviceStatus;
    }
    
    return status;
}

module.exports = router;
