// 🔐 Exemplos de uso das Edge Functions para autenticação admin

// Exemplo 1: Validar credenciais de administrador
async function validarCredenciaisAdmin(email, senha) {
    try {
        // Validar parâmetros
        if (!email || !senha) {
            throw new Error('Email e senha são obrigatórios');
        }
        
        // Preparar dados para a requisição
        const requestData = {
            action: 'verify_admin',
            email,
            password: senha
        };
        
        // Chamar a Edge Function
        const result = await window.EdgeFunctionsClient.adminAuth(requestData);
        
        // Verificar se a chamada foi bem-sucedida
        if (!result.success) {
            throw new Error(result.error || 'Credenciais inválidas');
        }
        
        // Salvar dados do administrador autenticado
        if (result.admin && result.token) {
            localStorage.setItem('adminInfo', JSON.stringify({
                id: result.admin.id,
                nome: result.admin.name,
                email: result.admin.email,
                token: result.token,
                permissions: result.admin.permissions || [],
                lastLogin: new Date().toISOString()
            }));
        }
        
        return {
            success: true,
            admin: result.admin,
            token: result.token
        };
    } catch (error) {
        console.error('Erro ao validar credenciais de administrador:', error);
        return {
            success: false,
            error: error.message || 'Erro na autenticação de administrador'
        };
    }
}

// Exemplo 2: Verificar permissão administrativa
function verificarPermissaoAdmin(permissao) {
    try {
        // Obter dados do admin do localStorage
        const adminData = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        
        // Verificar se está autenticado
        if (!adminData.token) {
            return false;
        }
        
        // Se não passou permissão específica, apenas verifica se está logado como admin
        if (!permissao) {
            return true;
        }
        
        // Verificar permissão específica
        const permissions = adminData.permissions || [];
        return permissions.includes(permissao) || permissions.includes('super_admin');
    } catch (error) {
        console.error('Erro ao verificar permissão administrativa:', error);
        return false;
    }
}

// Exemplo 3: Verificar token de administrador
async function verificarTokenAdmin() {
    try {
        // Obter dados do admin do localStorage
        const adminData = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        
        // Verificar se existe um token
        if (!adminData.token) {
            return { valid: false };
        }
        
        // Chamar a Edge Function para validar o token
        const result = await window.EdgeFunctionsClient.adminAuth({
            action: 'verify_token',
            token: adminData.token
        });
        
        return { 
            valid: result.success === true,
            admin: result.admin
        };
    } catch (error) {
        console.error('Erro ao verificar token de administrador:', error);
        return { valid: false };
    }
}

// Exportar funções para uso global
window.PortalAdminAuth = {
    validarCredenciaisAdmin,
    verificarPermissaoAdmin,
    verificarTokenAdmin
};
