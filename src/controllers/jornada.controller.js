// src/controllers/jornada.controller.js
const { pool } = require('../config/database');

class JornadaController {
    
    // Configurar prazos da jornada
    static async configurarPrazos(req, res) {
        const client = await pool.connect();
        try {
            const { 
                prazo_primeira_consulta, 
                prazo_retorno, 
                prazo_exames, 
                prazo_urgencia,
                notificacao_antecedencia 
            } = req.body;
            
            // Atualizar ou inserir configurações
            const configs = [
                { key: 'prazo_primeira_consulta', value: prazo_primeira_consulta },
                { key: 'prazo_retorno', value: prazo_retorno },
                { key: 'prazo_exames', value: prazo_exames },
                { key: 'prazo_urgencia', value: prazo_urgencia },
                { key: 'notificacao_antecedencia', value: notificacao_antecedencia }
            ];
            
            for (const config of configs) {
                await client.query(`
                    INSERT INTO system_config (config_key, config_value)
                    VALUES ($1, $2)
                    ON CONFLICT (config_key)
                    DO UPDATE SET config_value = EXCLUDED.config_value
                `, [config.key, config.value.toString()]);
            }
            
            // Log da configuração
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, detalhes)
                VALUES ($1, $2, $3)
            `, [
                'JORNADA_CONFIGURADA',
                'Prazos da jornada do paciente configurados',
                JSON.stringify(req.body)
            ]);
            
            res.json({
                success: true,
                message: 'Prazos configurados com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao configurar prazos:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Buscar configurações de prazos
    static async buscarPrazos(req, res) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT config_key, config_value
                FROM system_config
                WHERE config_key IN (
                    'prazo_primeira_consulta', 'prazo_retorno', 
                    'prazo_exames', 'prazo_urgencia', 'notificacao_antecedencia'
                )
            `);
            
            const prazos = {};
            result.rows.forEach(row => {
                prazos[row.config_key] = parseInt(row.config_value) || 0;
            });
            
            res.json({
                success: true,
                prazos
            });
            
        } catch (error) {
            console.error('Erro ao buscar prazos:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao carregar prazos' 
            });
        } finally {
            client.release();
        }
    }
    
    // Verificar prazos vencidos
    static async verificarPrazos(req, res) {
        const client = await pool.connect();
        try {
            // Aqui integraria com a tabela de pacientes quando migrada
            // Por enquanto, retorna estrutura base
            
            const prazosVencidos = await client.query(`
                SELECT 
                    'Paciente Exemplo' as nome_paciente,
                    'primeira_consulta' as tipo_prazo,
                    CURRENT_DATE - INTERVAL '5 days' as data_vencimento,
                    'VENCIDO' as status
                WHERE false -- Temporário até migrar pacientes
            `);
            
            res.json({
                success: true,
                prazos_vencidos: prazosVencidos.rows,
                total: prazosVencidos.rows.length
            });
            
        } catch (error) {
            console.error('Erro ao verificar prazos:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao verificar prazos' 
            });
        } finally {
            client.release();
        }
    }
    
    // Gerar notificações automáticas
    static async gerarNotificacoes(req, res) {
        const client = await pool.connect();
        try {
            // Buscar configuração de antecedência
            const configResult = await client.query(`
                SELECT config_value
                FROM system_config
                WHERE config_key = 'notificacao_antecedencia'
            `);
            
            const antecedencia = parseInt(configResult.rows[0]?.config_value) || 2;
            
            // Log das notificações geradas
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, detalhes)
                VALUES ($1, $2, $3)
            `, [
                'NOTIFICACOES_GERADAS',
                'Sistema de notificações executado',
                JSON.stringify({ antecedencia_dias: antecedencia })
            ]);
            
            res.json({
                success: true,
                message: 'Notificações processadas',
                notificacoes_enviadas: 0 // Temporário
            });
            
        } catch (error) {
            console.error('Erro ao gerar notificações:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao processar notificações' 
            });
        } finally {
            client.release();
        }
    }
}

module.exports = JornadaController;
