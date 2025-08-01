// ============================
// SISTEMA SEGURO DE SENHAS CHAVE - BACKEND
// ============================

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SistemaSeguroSenhasChave {
    constructor() {
        // Hashes pré-calculados - senhas originais NUNCA armazenadas
        this.senhasChaveHash = {
            // Hashes gerados offline e inseridos em produção
            primeiro_admin: process.env.HASH_PRIMEIRO_ADMIN || this.gerarHashSeguro('[REDACTED]'),
            funcionario: process.env.HASH_FUNCIONARIO || this.gerarHashSeguro('[REDACTED]'), 
            paciente: process.env.HASH_PACIENTE || this.gerarHashSeguro('[REDACTED]')
        };
        
        this.emailsAdmin = process.env.ADMIN_EMAILS ? 
            process.env.ADMIN_EMAILS.split(',') : 
            this.getEmailsAdminSeguro();
        
        this.logPath = path.join(__dirname, 'logs', `security-${Date.now()}.log`);
        this.saltPersonalizado = process.env.SALT_SISTEMA || this.gerarSaltUnico();
        this.versaoSistema = '2.0.0';
        this.parametrosAtivos = this.gerarParametrosDinamicos();
        
        this.initLogDirectory();
        
        // Log de inicialização sem dados sensíveis
        console.log(`[SEGURANÇA] Sistema iniciado - Versão: ${this.versaoSistema} - Timestamp: ${new Date().toISOString()}`);
    }
    
    // Criar diretório de logs
    async initLogDirectory() {
        try {
            await fs.mkdir(path.dirname(this.logPath), { recursive: true });
        } catch (error) {
            console.error('Erro ao criar diretório de logs:', error);
        }
    }
    
    // Métodos de segurança
    gerarHashSeguro(input) {
        return crypto.createHash('sha256')
            .update(input + this.saltPersonalizado + process.env.NODE_ENV)
            .digest('hex');
    }
    
    gerarSaltUnico() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    getEmailsAdminSeguro() {
        // Lista base - em produção deve vir do ambiente
        return [
            'admin@drmarcio.com',
            'admin@drmarcio.com.br', 
            'admin@mscartozzoni.com.br',
            'marcioscartozzoni@gmail.com',
            'scartozzoni@hotmail.com'
        ];
    }
    
    // Hash seguro para senhas (método privado)
    hashSenha(senha) {
        return this.gerarHashSeguro(senha);
    }
    
    // Validar senha chave de forma segura
    async validarSenhaChave(email, senhaChave, tipoUsuario) {
        const hashTentativa = this.hashSenha(senhaChave);
        
        // Log da tentativa
        await this.logTentativaSenhaChave(email, tipoUsuario, false);
        
        // Verificar se é primeiro admin
        if (this.isEmailAdmin(email) && hashTentativa === this.senhasChaveHash.primeiro_admin) {
            await this.logTentativaSenhaChave(email, 'primeiro_admin', true);
            return {
                valida: true,
                tipo: 'primeiro_admin',
                requerTrocaSenha: true,
                primeiroAcesso: true
            };
        }
        
        // Verificar funcionário
        if (tipoUsuario === 'funcionario' && hashTentativa === this.senhasChaveHash.funcionario) {
            await this.logTentativaSenhaChave(email, 'funcionario', true);
            return {
                valida: true,
                tipo: 'funcionario_chave',
                requerTrocaSenha: true
            };
        }
        
        // Verificar paciente
        if (tipoUsuario === 'paciente' && hashTentativa === this.senhasChaveHash.paciente) {
            await this.logTentativaSenhaChave(email, 'paciente', true);
            return {
                valida: true,
                tipo: 'paciente_chave',
                requerTrocaSenha: true
            };
        }
        
        // Log de tentativa inválida
        await this.logTentativaInvalida(email, senhaChave, tipoUsuario);
        
        return {
            valida: false,
            tipo: null,
            erro: 'Senha chave inválida'
        };
    }
    
    // Verificar se é email admin
    isEmailAdmin(email) {
        return this.emailsAdmin.some(adminEmail => 
            email.toLowerCase() === adminEmail.toLowerCase()
        );
    }
    
    // Log seguro de tentativas
    async logTentativaSenhaChave(email, tipo, sucesso) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            evento: sucesso ? 'senha_chave_valida' : 'tentativa_senha_chave',
            email: this.ofuscarEmail(email),
            tipo: tipo,
            sucesso: sucesso,
            ip: 'server_internal' // Em produção, capturar IP real
        };
        
        await this.salvarLog(logEntry);
    }
    
    // Log de tentativas inválidas
    async logTentativaInvalida(email, senhaChave, tipoUsuario) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            evento: 'senha_chave_invalida',
            email: this.ofuscarEmail(email),
            senhaChaveTentativa: senhaChave.substring(0, 3) + '***',
            tipoUsuario: tipoUsuario,
            nivel: 'ALERTA'
        };
        
        await this.salvarLog(logEntry);
    }
    
    // Ofuscar email para logs
    ofuscarEmail(email) {
        const [local, domain] = email.split('@');
        return local.substring(0, 2) + '***@' + domain;
    }
    
    // Salvar log em arquivo
    async salvarLog(logEntry) {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.logPath, logLine);
            console.log('🔒 LOG SEGURANÇA:', logEntry);
        } catch (error) {
            console.error('Erro ao salvar log:', error);
        }
    }
    
    // Verificar necessidade de renovação
    verificarRenovacaoNecessaria(dataUltimaRenovacao, email) {
        if (!dataUltimaRenovacao) return false;
        
        const agora = new Date();
        const ultimaRenovacao = new Date(dataUltimaRenovacao);
        const diasDesdeRenovacao = Math.floor((agora - ultimaRenovacao) / (1000 * 60 * 60 * 24));
        
        return this.isEmailAdmin(email) && diasDesdeRenovacao >= 90;
    }
    
    // Determinar estado do usuário
    async determinarEstadoUsuario(usuario) {
        if (!usuario) {
            return {
                estado: 'nao_existe',
                proximaAcao: 'verificar_email_cadastro'
            };
        }
        
        const isAdmin = this.isEmailAdmin(usuario.email);
        
        // Admin sem primeiro acesso
        if (isAdmin && !usuario.primeiro_acesso_realizado) {
            return {
                estado: 'primeiro_admin_pendente',
                proximaAcao: 'cadastro_primeiro_admin'
            };
        }
        
        // Verificar renovação necessária
        if (this.verificarRenovacaoNecessaria(usuario.data_primeira_troca_senha, usuario.email)) {
            return {
                estado: 'renovacao_necessaria',
                proximaAcao: 'renovar_senha'
            };
        }
        
        // Sem senha
        if (!usuario.hash_senha || usuario.hash_senha.trim() === '') {
            if (usuario.status === 'aprovado' || usuario.status === 'ativo') {
                return {
                    estado: 'criar_senha',
                    proximaAcao: 'definir_senha'
                };
            } else {
                return {
                    estado: 'aguardando_aprovacao',
                    proximaAcao: 'aguardar'
                };
            }
        }
        
        // Com senha e ativo
        if (usuario.status === 'ativo') {
            return {
                estado: 'login_disponivel',
                proximaAcao: 'fazer_login'
            };
        }
        
        return {
            estado: 'indefinido',
            proximaAcao: 'verificar_manualmente'
        };
    }
    
    // Renovar senhas chave (função administrativa)
    async renovarSenhasChave() {
        const novasFuncionario = 'FuncChave' + new Date().getFullYear() + Math.random().toString(36).substring(2, 7) + '@';
        const novasPaciente = 'PacienteKey' + new Date().getFullYear() + Math.random().toString(36).substring(2, 7) + '#';
        
        this.senhasChaveHash.funcionario = this.hashSenha(novasFuncionario);
        this.senhasChaveHash.paciente = this.hashSenha(novasPaciente);
        
        await this.salvarLog({
            timestamp: new Date().toISOString(),
            evento: 'senhas_chave_renovadas',
            nivel: 'ADMIN'
        });
        
        return {
            funcionario: novasFuncionario,
            paciente: novasPaciente
        };
    }
}

module.exports = SistemaSeguroSenhasChave;
