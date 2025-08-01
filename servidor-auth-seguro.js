// ============================
// SERVIDOR SEGURO DE AUTENTICAÇÃO
// ============================

const express = require('express');
const bcrypt = require('bcrypt');
const SistemaSeguroSenhasChave = require('./sistema-seguro-senhas-chave');

class ServidorAutenticacaoSeguro {
    constructor() {
        this.sistemaSeguro = new SistemaSeguroSenhasChave();
        this.router = express.Router();
        this.initRoutes();
    }
    
    initRoutes() {
        // Validação segura de senha chave
        this.router.post('/api/auth/validar-senha-chave', this.validarSenhaChave.bind(this));
        
        // Status do usuário (sem expor dados sensíveis)
        this.router.get('/api/auth/status-usuario/:token', this.statusUsuario.bind(this));
        
        // Cadastro com senha chave
        this.router.post('/api/auth/cadastro-seguro', this.cadastroSeguro.bind(this));
        
        // Login seguro
        this.router.post('/api/auth/login-seguro', this.loginSeguro.bind(this));
        
        // Log de segurança
        this.router.post('/api/security/log', this.receberLogSeguranca.bind(this));
        
        // Renovação administrativa de senhas chave
        this.router.post('/api/admin/renovar-senhas-chave', this.renovarSenhasChave.bind(this));
    }
    
    // Validar senha chave de forma segura
    async validarSenhaChave(req, res) {
        try {
            const { a1: email, b1: senhaChave, c1: tipoUsuario } = req.body;
            
            if (!email || !senhaChave) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Parâmetros obrigatórios ausentes'
                });
            }
            
            const validacao = await this.sistemaSeguro.validarSenhaChave(email, senhaChave, tipoUsuario);
            
            // Nunca retornar senhas ou hashes
            const resposta = {
                sucesso: validacao.valida,
                tipo: validacao.tipo,
                requerTrocaSenha: validacao.requerTrocaSenha,
                primeiroAcesso: validacao.primeiroAcesso
            };
            
            if (!validacao.valida) {
                resposta.erro = 'Credenciais inválidas';
            }
            
            res.json(resposta);
            
        } catch (error) {
            console.error('Erro na validação:', error);
            res.status(500).json({
                sucesso: false,
                erro: 'Erro interno do servidor'
            });
        }
    }
    
    // Status do usuário (parâmetros obfuscados)
    async statusUsuario(req, res) {
        try {
            const { token } = req.params;
            
            // Decodificar token seguro
            const email = this.decodificarToken(token);
            if (!email) {
                return res.status(400).json({
                    erro: 'Token inválido'
                });
            }
            
            // Buscar usuário no banco (implementar conforme seu sistema)
            const usuario = await this.buscarUsuario(email);
            
            // Determinar estado sem expor dados sensíveis
            const estado = await this.sistemaSeguro.determinarEstadoUsuario(usuario);
            
            res.json({
                existe: !!usuario,
                estado: estado.estado,
                proximaAcao: estado.proximaAcao,
                // Dados seguros para frontend
                dados: usuario ? {
                    nome: usuario.nome,
                    tipo: usuario.tipo,
                    status: usuario.status
                } : null
            });
            
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            res.status(500).json({
                erro: 'Erro interno do servidor'
            });
        }
    }
    
    // Cadastro seguro com senha chave
    async cadastroSeguro(req, res) {
        try {
            const { a1: email, b1: senhaChave, c1: tipoUsuario, dados } = req.body;
            
            // Validar senha chave primeiro
            const validacao = await this.sistemaSeguro.validarSenhaChave(email, senhaChave, tipoUsuario);
            
            if (!validacao.valida) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Senha chave inválida'
                });
            }
            
            // Verificar se usuário já existe
            const usuarioExistente = await this.buscarUsuario(email);
            if (usuarioExistente) {
                return res.status(400).json({
                    sucesso: false,
                    erro: 'Email já cadastrado'
                });
            }
            
            // Criar usuário baseado no tipo de senha chave
            const novoUsuario = {
                email: email,
                nome: dados.nome,
                telefone: dados.telefone || '',
                cpf: dados.cpf || '',
                tipo: this.determinarTipoUsuario(validacao.tipo),
                status: this.determinarStatusInicial(validacao.tipo),
                data_cadastro: new Date().toISOString(),
                senha_chave_utilizada: validacao.tipo,
                data_uso_senha_chave: new Date().toISOString(),
                primeiro_acesso_realizado: validacao.primeiroAcesso || false
            };
            
            // Salvar usuário (implementar conforme seu sistema)
            const resultado = await this.salvarUsuario(novoUsuario);
            
            res.json({
                sucesso: true,
                mensagem: 'Cadastro realizado com sucesso',
                proximaEtapa: validacao.requerTrocaSenha ? 'criar_senha' : 'aguardar_aprovacao'
            });
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            res.status(500).json({
                sucesso: false,
                erro: 'Erro interno do servidor'
            });
        }
    }
    
    // Login seguro
    async loginSeguro(req, res) {
        try {
            const { email, senha } = req.body;
            
            // Verificar se não está tentando usar senha chave
            const tentativaSenhaChave = await this.sistemaSeguro.validarSenhaChave(email, senha, 'funcionario');
            if (tentativaSenhaChave.valida) {
                // ALERTA DE SEGURANÇA
                await this.sistemaSeguro.salvarLog({
                    timestamp: new Date().toISOString(),
                    evento: 'ALERTA_LOGIN_SENHA_CHAVE',
                    email: this.sistemaSeguro.ofuscarEmail(email),
                    ip: req.ip || 'unknown',
                    nivel: 'CRITICO'
                });
                
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Tentativa de login com credenciais inválidas detectada'
                });
            }
            
            // Buscar usuário
            const usuario = await this.buscarUsuario(email);
            if (!usuario || !usuario.hash_senha) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Credenciais inválidas'
                });
            }
            
            // Verificar renovação necessária
            if (this.sistemaSeguro.verificarRenovacaoNecessaria(usuario.data_primeira_troca_senha, email)) {
                return res.json({
                    sucesso: false,
                    acao: 'renovar_senha',
                    erro: 'Senha expirada - renovação obrigatória'
                });
            }
            
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, usuario.hash_senha);
            if (!senhaValida) {
                return res.status(401).json({
                    sucesso: false,
                    erro: 'Credenciais inválidas'
                });
            }
            
            // Login bem-sucedido
            res.json({
                sucesso: true,
                usuario: {
                    email: usuario.email,
                    nome: usuario.nome,
                    tipo: usuario.tipo
                },
                redirectUrl: this.determinarRedirecionamento(usuario.tipo)
            });
            
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({
                sucesso: false,
                erro: 'Erro interno do servidor'
            });
        }
    }
    
    // Receber logs de segurança do frontend
    async receberLogSeguranca(req, res) {
        try {
            const { a1: email, d1: timestamp, evento, detalhes } = req.body;
            
            const logEntry = {
                timestamp: timestamp || new Date().toISOString(),
                evento: evento,
                email: email,
                detalhes: detalhes,
                origem: 'frontend',
                ip: req.ip || 'unknown'
            };
            
            await this.sistemaSeguro.salvarLog(logEntry);
            
            res.json({ sucesso: true });
            
        } catch (error) {
            console.error('Erro ao processar log:', error);
            res.status(500).json({ erro: 'Erro interno' });
        }
    }
    
    // Renovar senhas chave (apenas admin)
    async renovarSenhasChave(req, res) {
        try {
            // Verificar se é admin (implementar autenticação admin)
            const isAdmin = await this.verificarAdmin(req);
            if (!isAdmin) {
                return res.status(403).json({
                    erro: 'Acesso negado'
                });
            }
            
            const novasSenhas = await this.sistemaSeguro.renovarSenhasChave();
            
            res.json({
                sucesso: true,
                novasSenhas: novasSenhas
            });
            
        } catch (error) {
            console.error('Erro ao renovar senhas:', error);
            res.status(500).json({
                erro: 'Erro interno do servidor'
            });
        }
    }
    
    // Métodos auxiliares
    decodificarToken(token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString();
            const [email] = decoded.split(':');
            return email;
        } catch {
            return null;
        }
    }
    
    determinarTipoUsuario(tipoSenhaChave) {
        switch (tipoSenhaChave) {
            case 'primeiro_admin': return 'admin';
            case 'funcionario_chave': return 'funcionario';
            case 'paciente_chave': return 'paciente';
            default: return 'funcionario';
        }
    }
    
    determinarStatusInicial(tipoSenhaChave) {
        switch (tipoSenhaChave) {
            case 'primeiro_admin': return 'ativo';
            case 'funcionario_chave': return 'aprovado';
            case 'paciente_chave': return 'aprovado';
            default: return 'pendente_aprovacao';
        }
    }
    
    determinarRedirecionamento(tipoUsuario) {
        switch (tipoUsuario) {
            case 'admin': return '/admin.html';
            case 'funcionario': return '/dashboard-funcionario.html';
            case 'paciente': return '/dashboard.html';
            default: return '/dashboard.html';
        }
    }
    
    // Implementar conforme seu sistema de banco de dados
    async buscarUsuario(email) {
        // Implementar busca no banco
        return null;
    }
    
    async salvarUsuario(usuario) {
        // Implementar salvamento no banco
        return true;
    }
    
    async verificarAdmin(req) {
        // Implementar verificação de admin
        return false;
    }
    
    // Getter para o router
    getRouter() {
        return this.router;
    }
}

module.exports = ServidorAutenticacaoSeguro;
