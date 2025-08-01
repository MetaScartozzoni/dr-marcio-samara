// ============================
// SISTEMA DE SENHAS CHAVE
// ============================

const SENHAS_CHAVE = {
    // Senha de primeiro admin - uso único
    PRIMEIRO_ADMIN: 'AdminMestre2025!',
    
    // Senhas para funcionários (renovadas a cada 90 dias)
    FUNCIONARIO: 'FuncChave2025@',
    
    // Senhas para pacientes (renovadas a cada 90 dias)  
    PACIENTE: 'PacienteKey2025#'
};

const EMAILS_ADMIN = [
    'admin@drmarcio.com',
    'admin@drmarcio.com.br',
    'admin@mscartozzoni.com.br',
    'marcioscartozzoni@gmail.com',
    'scartozzoni@hotmail.com'
];

// ============================
// FUNÇÕES DE VALIDAÇÃO
// ============================

function validarSenhaChave(email, senha, tipoUsuario) {
    // Verificar se é email admin
    const isEmailAdmin = EMAILS_ADMIN.some(adminEmail => 
        email.toLowerCase() === adminEmail.toLowerCase()
    );
    
    if (isEmailAdmin && senha === SENHAS_CHAVE.PRIMEIRO_ADMIN) {
        return {
            valida: true,
            tipo: 'primeiro_admin',
            requerTrocaSenha: true,
            mensagem: 'Senha de primeiro admin detectada - requer troca imediata'
        };
    }
    
    if (tipoUsuario === 'funcionario' && senha === SENHAS_CHAVE.FUNCIONARIO) {
        return {
            valida: true,
            tipo: 'funcionario_chave',
            requerTrocaSenha: true,
            mensagem: 'Senha chave de funcionário - requer criação de senha pessoal'
        };
    }
    
    if (tipoUsuario === 'paciente' && senha === SENHAS_CHAVE.PACIENTE) {
        return {
            valida: true,
            tipo: 'paciente_chave',
            requerTrocaSenha: true,
            mensagem: 'Senha chave de paciente - requer criação de senha pessoal'
        };
    }
    
    return {
        valida: false,
        tipo: null,
        requerTrocaSenha: false,
        mensagem: 'Senha chave inválida'
    };
}

function calcularProximaRenovacao(dataUltimaRenovacao = null) {
    const agora = new Date();
    const dataBase = dataUltimaRenovacao ? new Date(dataUltimaRenovacao) : agora;
    
    const proximaRenovacao = new Date(dataBase);
    proximaRenovacao.setDate(proximaRenovacao.getDate() + 90);
    
    return proximaRenovacao;
}

function verificarSeNecessitaRenovacao(dataUltimaRenovacao, email) {
    if (!dataUltimaRenovacao) return false;
    
    const agora = new Date();
    const ultimaRenovacao = new Date(dataUltimaRenovacao);
    const diasDesdeRenovacao = Math.floor((agora - ultimaRenovacao) / (1000 * 60 * 60 * 24));
    
    // Admin precisa renovar a cada 90 dias
    const isEmailAdmin = EMAILS_ADMIN.some(adminEmail => 
        email.toLowerCase() === adminEmail.toLowerCase()
    );
    
    if (isEmailAdmin && diasDesdeRenovacao >= 90) {
        return true;
    }
    
    return false;
}

// ============================
// ESTADO DO USUÁRIO
// ============================

function determinarEstadoUsuario(usuario) {
    if (!usuario) {
        return {
            estado: 'nao_existe',
            proximaAcao: 'verificar_email_para_cadastro',
            destino: 'index.html'
        };
    }
    
    const isEmailAdmin = EMAILS_ADMIN.some(adminEmail => 
        usuario.email.toLowerCase() === adminEmail.toLowerCase()
    );
    
    // Verificar se é primeiro acesso do admin
    if (isEmailAdmin && (!usuario.hash_senha || usuario.hash_senha.trim() === '')) {
        if (!usuario.primeiro_acesso_realizado) {
            return {
                estado: 'primeiro_admin_pendente',
                proximaAcao: 'verificar_email_e_cadastrar',
                destino: 'index.html',
                requerSenhaChave: true
            };
        }
    }
    
    // Verificar se necessita renovação de senha (90 dias)
    if (usuario.data_primeira_troca_senha && verificarSeNecessitaRenovacao(usuario.data_primeira_troca_senha, usuario.email)) {
        return {
            estado: 'renovacao_senha_necessaria',
            proximaAcao: 'trocar_senha',
            destino: 'recuperar-senha.html',
            motivo: 'Senha expirada - renovação obrigatória a cada 90 dias'
        };
    }
    
    // Usuário sem senha (precisa criar)
    if (!usuario.hash_senha || usuario.hash_senha.trim() === '') {
        if (usuario.status === 'pendente_aprovacao') {
            return {
                estado: 'aguardando_aprovacao',
                proximaAcao: 'aguardar',
                destino: 'aguardando-autorizacao.html'
            };
        }
        
        if (usuario.status === 'aprovado' || usuario.status === 'ativo') {
            return {
                estado: 'criar_senha',
                proximaAcao: 'definir_senha',
                destino: 'senha.html'
            };
        }
    }
    
    // Usuário com senha (pode fazer login)
    if (usuario.hash_senha && usuario.hash_senha.trim() !== '') {
        if (usuario.status === 'ativo') {
            return {
                estado: 'login_disponivel',
                proximaAcao: 'fazer_login',
                destino: 'login.html'
            };
        }
    }
    
    return {
        estado: 'indefinido',
        proximaAcao: 'verificar_manualmente',
        destino: 'index.html'
    };
}

// ============================
// LOG DE SEGURANÇA
// ============================

function criarLogSeguranca(evento, email, detalhes = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        evento: evento,
        email: email,
        ip: detalhes.ip || 'unknown',
        userAgent: detalhes.userAgent || 'unknown',
        detalhes: detalhes
    };
    
    console.log('🔒 LOG SEGURANÇA:', logEntry);
    
    // Em produção, salvar em base de dados
    return logEntry;
}

// ============================
// EXPORT
// ============================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SENHAS_CHAVE,
        EMAILS_ADMIN,
        validarSenhaChave,
        calcularProximaRenovacao,
        verificarSeNecessitaRenovacao,
        determinarEstadoUsuario,
        criarLogSeguranca
    };
}

// Para uso no frontend
if (typeof window !== 'undefined') {
    window.ConfigSenhasChave = {
        SENHAS_CHAVE,
        EMAILS_ADMIN,
        validarSenhaChave,
        calcularProximaRenovacao,
        verificarSeNecessitaRenovacao,
        determinarEstadoUsuario,
        criarLogSeguranca
    };
}
