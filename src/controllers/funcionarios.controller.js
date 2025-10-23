// src/controllers/funcionarios.controller.js
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// NOTE: UUID COMPATIBILITY
// This controller works with UUID primary keys. PostgreSQL parameterized queries
// handle UUID types automatically. Validate UUIDs using validateUuidParam() middleware.

class FuncionariosController {
    
    // Cadastrar novo funcionário
    static async cadastrar(req, res) {
        const client = await pool.connect();
        try {
            const { nome, email, senha, telefone, cpf, tipo = 'staff' } = req.body;
            
            // Verificar se email já existe
            const emailExists = await client.query(
                'SELECT id FROM funcionarios WHERE email = $1',
                [email]
            );
            
            if (emailExists.rows.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email já cadastrado' 
                });
            }
            
            // Criptografar senha
            const senhaHash = await bcrypt.hash(senha, 10);
            
            // Inserir funcionário
            const result = await client.query(`
                INSERT INTO funcionarios (nome, email, senha, telefone, cpf, tipo)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, nome, email, telefone, tipo, ativo, data_cadastro
            `, [nome, email, senhaHash, telefone, cpf, tipo]);
            
            // Log da ação
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, usuario_id, detalhes)
                VALUES ($1, $2, $3, $4)
            `, [
                'FUNCIONARIO_CADASTRADO',
                `Funcionário ${nome} cadastrado com sucesso`,
                result.rows[0].id,
                JSON.stringify({ email, tipo })
            ]);
            
            res.json({
                success: true,
                message: 'Funcionário cadastrado com sucesso',
                funcionario: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Listar funcionários
    static async listar(req, res) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT id, nome, email, telefone, cpf, tipo, ativo, data_cadastro
                FROM funcionarios
                ORDER BY data_cadastro DESC
            `);
            
            res.json({
                success: true,
                funcionarios: result.rows
            });
            
        } catch (error) {
            console.error('Erro ao listar funcionários:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao carregar funcionários' 
            });
        } finally {
            client.release();
        }
    }
    
    // Buscar funcionário por ID
    static async buscarPorId(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            
            const result = await client.query(`
                SELECT id, nome, email, telefone, cpf, tipo, ativo, data_cadastro
                FROM funcionarios
                WHERE id = $1
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Funcionário não encontrado' 
                });
            }
            
            res.json({
                success: true,
                funcionario: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erro ao buscar funcionário:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Atualizar funcionário
    static async atualizar(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            const { nome, email, telefone, cpf, tipo, ativo } = req.body;
            
            const result = await client.query(`
                UPDATE funcionarios
                SET nome = $1, email = $2, telefone = $3, cpf = $4, tipo = $5, ativo = $6
                WHERE id = $7
                RETURNING id, nome, email, telefone, tipo, ativo
            `, [nome, email, telefone, cpf, tipo, ativo, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Funcionário não encontrado' 
                });
            }
            
            // Log da ação
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, usuario_id, detalhes)
                VALUES ($1, $2, $3, $4)
            `, [
                'FUNCIONARIO_ATUALIZADO',
                `Funcionário ${nome} atualizado`,
                id,
                JSON.stringify({ campos_alterados: Object.keys(req.body) })
            ]);
            
            res.json({
                success: true,
                message: 'Funcionário atualizado com sucesso',
                funcionario: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erro ao atualizar funcionário:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Deletar funcionário (soft delete)
    static async deletar(req, res) {
        const client = await pool.connect();
        try {
            const { id } = req.params;
            
            const result = await client.query(`
                UPDATE funcionarios
                SET ativo = false
                WHERE id = $1
                RETURNING nome
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Funcionário não encontrado' 
                });
            }
            
            // Log da ação
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, usuario_id, detalhes)
                VALUES ($1, $2, $3, $4)
            `, [
                'FUNCIONARIO_DESATIVADO',
                `Funcionário ${result.rows[0].nome} desativado`,
                id,
                JSON.stringify({ motivo: 'Removido via admin' })
            ]);
            
            res.json({
                success: true,
                message: 'Funcionário desativado com sucesso'
            });
            
        } catch (error) {
            console.error('Erro ao deletar funcionário:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Autenticar funcionário
    static async autenticar(req, res) {
        const client = await pool.connect();
        try {
            const { email, senha } = req.body;
            
            const result = await client.query(`
                SELECT id, nome, email, senha, tipo, ativo
                FROM funcionarios
                WHERE email = $1 AND ativo = true
            `, [email]);
            
            if (result.rows.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email ou senha inválidos' 
                });
            }
            
            const funcionario = result.rows[0];
            const senhaValida = await bcrypt.compare(senha, funcionario.senha);
            
            if (!senhaValida) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email ou senha inválidos' 
                });
            }
            
            // Log do login
            await client.query(`
                INSERT INTO logs_sistema (tipo, descricao, usuario_id, detalhes)
                VALUES ($1, $2, $3, $4)
            `, [
                'LOGIN_FUNCIONARIO',
                `Login realizado por ${funcionario.nome}`,
                funcionario.id,
                JSON.stringify({ ip: req.ip, user_agent: req.get('User-Agent') })
            ]);
            
            // Remover senha da resposta
            delete funcionario.senha;
            
            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                funcionario
            });
            
        } catch (error) {
            console.error('Erro na autenticação:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        } finally {
            client.release();
        }
    }
}

module.exports = FuncionariosController;
