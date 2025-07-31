const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const { pool } = require('../config/database');
const { checkSetupCompleted } = require('../middleware/setup.middleware');

// Página de setup (protegida - só acessível se não houver admin)
router.get('/', checkSetupCompleted, (req, res) => {
    res.sendFile(path.join(__dirname, '../../setup.html'));
});

// API para inicializar o sistema
router.post('/initialize', checkSetupCompleted, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            // Dados da clínica
            clinicName,
            clinicEmail,
            clinicPhone,
            clinicAddress,
            
            // Dados do admin
            adminName,
            adminEmail,
            adminPhone,
            adminCpf,
            adminPassword,
            
            // Funcionalidades
            selectedFeatures
        } = req.body;

        // Validar dados obrigatórios
        if (!clinicName || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({
                error: 'Dados obrigatórios não fornecidos'
            });
        }

        // Verificar se já existe um admin (dupla verificação)
        const existingAdmin = await client.query(
            "SELECT COUNT(*) as count FROM funcionarios WHERE tipo = 'admin'"
        );
        
        if (parseInt(existingAdmin.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Sistema já foi configurado'
            });
        }

        // 1. Atualizar configurações da clínica no .env (se necessário)
        await updateClinicConfig({
            name: clinicName,
            email: clinicEmail,
            phone: clinicPhone,
            address: clinicAddress
        });

        // 2. Criar o primeiro administrador
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const adminResult = await client.query(`
            INSERT INTO funcionarios (
                nome, email, telefone, cpf, senha, tipo, 
                ativo, data_cadastro, cadastrado_por
            ) VALUES ($1, $2, $3, $4, $5, 'admin', true, NOW(), 'system')
            RETURNING id, nome, email
        `, [
            adminName,
            adminEmail,
            adminPhone,
            adminCpf.replace(/\D/g, ''), // Remove máscara do CPF
            hashedPassword
        ]);

        const admin = adminResult.rows[0];

        // 3. Configurar funcionalidades selecionadas
        await configureSystemFeatures(client, selectedFeatures, admin.id);

        // 4. Criar configurações iniciais do sistema
        await createInitialSystemConfig(client, {
            clinicName,
            clinicEmail,
            clinicPhone,
            clinicAddress,
            adminId: admin.id
        });

        // 5. Log da configuração inicial
        await client.query(`
            INSERT INTO logs_sistema (
                tipo, descricao, usuario_id, data_evento, detalhes
            ) VALUES (
                'SETUP', 
                'Sistema configurado inicialmente', 
                $1, 
                NOW(), 
                $2
            )
        `, [
            admin.id,
            JSON.stringify({
                clinic: { name: clinicName, email: clinicEmail },
                admin: { name: adminName, email: adminEmail },
                features: selectedFeatures
            })
        ]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Sistema configurado com sucesso',
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao inicializar sistema:', error);
        
        res.status(500).json({
            error: 'Erro interno do servidor',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Verificar status do setup
router.get('/status', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT COUNT(*) as count FROM funcionarios WHERE tipo = 'admin'"
        );
        
        const isSetupComplete = parseInt(result.rows[0].count) > 0;
        
        res.json({
            setupComplete: isSetupComplete,
            needsSetup: !isSetupComplete
        });
        
    } catch (error) {
        console.error('Erro ao verificar status do setup:', error);
        res.status(500).json({
            error: 'Erro ao verificar status do sistema'
        });
    }
});

// Função auxiliar para atualizar configurações da clínica
async function updateClinicConfig(clinicData) {
    // Aqui você pode implementar a atualização do .env
    // ou salvar em uma tabela de configurações
    
    // Por enquanto, vamos apenas logar
    console.log('📋 Configurações da clínica:', clinicData);
    
    // Futuramente, pode salvar em uma tabela:
    /*
    await pool.query(`
        INSERT INTO configuracoes_clinica (nome, email, telefone, endereco)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        endereco = EXCLUDED.endereco
    `, [clinicData.name, clinicData.email, clinicData.phone, clinicData.address]);
    */
}

// Função auxiliar para configurar funcionalidades
async function configureSystemFeatures(client, features, adminId) {
    for (const feature of features) {
        await client.query(`
            INSERT INTO system_config (
                config_key, config_value, is_locked, created_by, created_at
            ) VALUES ($1, $2, false, $3, NOW())
            ON CONFLICT (config_key) DO UPDATE SET
            config_value = EXCLUDED.config_value
        `, [
            `feature_${feature}_enabled`,
            'true',
            adminId
        ]);
    }
    
    console.log('✅ Funcionalidades configuradas:', features);
}

// Função auxiliar para criar configurações iniciais
async function createInitialSystemConfig(client, config) {
    const initialConfigs = [
        ['system_initialized', 'true'],
        ['setup_date', new Date().toISOString()],
        ['clinic_name', config.clinicName],
        ['clinic_email', config.clinicEmail],
        ['clinic_phone', config.clinicPhone],
        ['clinic_address', config.clinicAddress],
        ['initial_admin_id', config.adminId.toString()]
    ];
    
    for (const [key, value] of initialConfigs) {
        await client.query(`
            INSERT INTO system_config (
                config_key, config_value, is_locked, created_by, created_at
            ) VALUES ($1, $2, true, $3, NOW())
            ON CONFLICT (config_key) DO UPDATE SET
            config_value = EXCLUDED.config_value
        `, [key, value, config.adminId]);
    }
}

module.exports = router;
