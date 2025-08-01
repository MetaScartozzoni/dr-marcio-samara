// ============================
// CONFIGURAÇÃO SEGURA FRONTEND
// ============================

// APENAS funções utilitárias e validações - SEM SENHAS
const ConfigSeguro = {
    // Lista de emails admin (pode ser pública)
    EMAILS_ADMIN: [
        'admin@drmarcio.com',
        'admin@drmarcio.com.br',
        'admin@mscartozzoni.com.br',
        'marcioscartozzoni@gmail.com',
        'scartozzoni@hotmail.com'
    ],
    
    // Parâmetros dinâmicos gerados a cada sessão
    PARAMS: {
        // Gerados automaticamente - nunca hardcoded
        getParamMap() {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2);
            
            return {
                [`${timestamp.substring(0,2)}${random.substring(0,1)}`]: 'email',
                [`${random.substring(1,2)}${timestamp.substring(2,4)}`]: 'chave_acesso',
                [`${timestamp.substring(4,6)}${random.substring(2,3)}`]: 'tipo_usuario',
                [`${random.substring(3,4)}${timestamp.substring(6,8)}`]: 'timestamp',
                [`${timestamp.substring(8,10)}${random.substring(4,5)}`]: 'token_validacao'
            };
        }
    },
    
    // Funções utilitárias
    isEmailAdmin(email) {
        return this.EMAILS_ADMIN.some(adminEmail => 
            email.toLowerCase() === adminEmail.toLowerCase()
        );
    },
    
    // Determinar próxima ação do usuário (sem expor lógica sensível)
    determinarProximaAcao(statusUsuario) {
        if (!statusUsuario) {
            return {
                acao: 'verificar_email',
                destino: 'index.html'
            };
        }
        
        // Lógica baseada em status recebido do backend
        switch (statusUsuario.estado) {
            case 'renovacao_necessaria':
                return {
                    acao: 'renovar_senha',
                    destino: 'recuperar-senha.html',
                    motivo: 'Senha expirada'
                };
            case 'criar_senha':
                return {
                    acao: 'definir_senha', 
                    destino: 'senha.html'
                };
            case 'login_disponivel':
                return {
                    acao: 'fazer_login',
                    destino: 'login.html'
                };
            case 'aguardando_aprovacao':
                return {
                    acao: 'aguardar',
                    destino: 'aguardando-autorizacao.html'
                };
            default:
                return {
                    acao: 'verificar_email',
                    destino: 'index.html'
                };
        }
    },
    
    // Log de segurança (apenas frontend)
    criarLogSeguranca(evento, email, detalhes = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            evento: evento,
            email: email.substring(0, 3) + '***', // Ofuscar email
            detalhes: detalhes
        };
        
        console.log('🔒 LOG SEGURANÇA:', logEntry);
        
        // Enviar para backend de forma segura
        this.enviarLogSeguranca(logEntry);
        
        return logEntry;
    },
    
    // Enviar log para backend
    async enviarLogSeguranca(logEntry) {
        try {
            const paramMap = this.PARAMS.getParamMap();
            const params = Object.keys(paramMap);
            
            const payload = {};
            payload[params[0]] = logEntry.email;
            payload[params[3]] = logEntry.timestamp;
            payload['evento'] = logEntry.evento;
            payload['detalhes'] = logEntry.detalhes;
            
            await fetch('/api/security/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Erro ao enviar log:', error);
        }
    },
    
    // Validar token de sessão
    validarTokenSessao() {
        const token = localStorage.getItem('sessionToken');
        const timestamp = localStorage.getItem('sessionTimestamp');
        
        if (!token || !timestamp) return false;
        
        const agora = Date.now();
        const tokenTime = parseInt(timestamp);
        const cincoMinutos = 5 * 60 * 1000;
        
        return (agora - tokenTime) < cincoMinutos;
    },
    
    // Gerar token de verificação
    gerarTokenVerificacao(email) {
        const timestamp = Date.now();
        const token = btoa(`${email}:${timestamp}:${Math.random()}`);
        
        localStorage.setItem('sessionToken', token);
        localStorage.setItem('sessionTimestamp', timestamp.toString());
        
        return token;
    }
};

// Export para uso global
if (typeof window !== 'undefined') {
    window.ConfigSeguro = ConfigSeguro;
}
