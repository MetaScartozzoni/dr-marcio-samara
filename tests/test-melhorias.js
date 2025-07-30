// ========== SCRIPT DE TESTES PARA VALIDAÇÃO ==========

// Função para executar todos os testes
function executarTodosOsTestes() {
    console.log('🧪 Iniciando testes de validação das melhorias...\n');
    
    const resultados = {
        passou: 0,
        falhou: 0,
        detalhes: []
    };
    
    // Lista de testes
    const testes = [
        testNotificationManager,
        testFormValidator,
        testApiManager,
        testUtils,
        testAuthManager,
        testOrcamentoManager,
        testConfigManager,
        testElementosDOM,
        testAcessibilidade,
        testResponsividade
    ];
    
    // Executar cada teste
    testes.forEach(teste => {
        try {
            const resultado = teste();
            if (resultado.sucesso) {
                resultados.passou++;
                console.log(`✅ ${resultado.nome}: ${resultado.mensagem}`);
            } else {
                resultados.falhou++;
                console.log(`❌ ${resultado.nome}: ${resultado.mensagem}`);
            }
            resultados.detalhes.push(resultado);
        } catch (error) {
            resultados.falhou++;
            console.log(`❌ ${teste.name}: Erro durante execução - ${error.message}`);
            resultados.detalhes.push({
                nome: teste.name,
                sucesso: false,
                mensagem: `Erro durante execução: ${error.message}`
            });
        }
    });
    
    // Mostrar resumo
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`✅ Passou: ${resultados.passou}`);
    console.log(`❌ Falhou: ${resultados.falhou}`);
    console.log(`📊 Total: ${resultados.passou + resultados.falhou}`);
    console.log(`🎯 Taxa de sucesso: ${((resultados.passou / (resultados.passou + resultados.falhou)) * 100).toFixed(1)}%`);
    
    return resultados;
}

// ========== TESTES INDIVIDUAIS ==========

function testNotificationManager() {
    const nome = 'NotificationManager';
    
    if (typeof NotificationManager === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    if (typeof NotificationManager.show !== 'function') {
        return { nome, sucesso: false, mensagem: 'Método show() não encontrado' };
    }
    
    if (typeof NotificationManager.getIcon !== 'function') {
        return { nome, sucesso: false, mensagem: 'Método getIcon() não encontrado' };
    }
    
    // Teste funcional
    try {
        NotificationManager.show('Teste', 'info', 1000);
        const container = document.getElementById('notification-container');
        if (!container) {
            return { nome, sucesso: false, mensagem: 'Container de notificações não criado' };
        }
    } catch (error) {
        return { nome, sucesso: false, mensagem: `Erro ao exibir notificação: ${error.message}` };
    }
    
    return { nome, sucesso: true, mensagem: 'Sistema de notificações funcionando' };
}

function testFormValidator() {
    const nome = 'FormValidator';
    
    if (typeof FormValidator === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['validateRequired', 'validateEmail', 'validateDate', 'validateNumber', 'validatePhone'];
    
    for (const metodo of metodos) {
        if (typeof FormValidator[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    // Testes funcionais
    try {
        // Teste email válido
        FormValidator.validateEmail('test@example.com');
        
        // Teste número válido
        FormValidator.validateNumber(100, 'Teste', 0, 200);
        
        // Teste campo obrigatório
        try {
            FormValidator.validateRequired('', 'Campo Teste');
            return { nome, sucesso: false, mensagem: 'Validação de campo obrigatório não funcionou' };
        } catch (e) {
            // Esperado que dê erro
        }
        
    } catch (error) {
        return { nome, sucesso: false, mensagem: `Erro nas validações: ${error.message}` };
    }
    
    return { nome, sucesso: true, mensagem: 'Sistema de validação funcionando' };
}

function testApiManager() {
    const nome = 'ApiManager';
    
    if (typeof ApiManager === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['request', 'get', 'post', 'put', 'delete'];
    
    for (const metodo of metodos) {
        if (typeof ApiManager[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    return { nome, sucesso: true, mensagem: 'Gerenciador de API configurado corretamente' };
}

function testUtils() {
    const nome = 'Utils';
    
    if (typeof Utils === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['formatCurrency', 'formatDate', 'generateId', 'debounce', 'sanitizeHtml'];
    
    for (const metodo of metodos) {
        if (typeof Utils[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    // Testes funcionais
    try {
        const moeda = Utils.formatCurrency(1234.56);
        if (!moeda.includes('R$')) {
            return { nome, sucesso: false, mensagem: 'Formatação de moeda incorreta' };
        }
        
        const data = Utils.formatDate('2025-07-30');
        if (!data.includes('/')) {
            return { nome, sucesso: false, mensagem: 'Formatação de data incorreta' };
        }
        
        const id = Utils.generateId('TEST');
        if (!id.startsWith('TEST_')) {
            return { nome, sucesso: false, mensagem: 'Geração de ID incorreta' };
        }
        
    } catch (error) {
        return { nome, sucesso: false, mensagem: `Erro nos utilitários: ${error.message}` };
    }
    
    return { nome, sucesso: true, mensagem: 'Utilitários funcionando corretamente' };
}

function testAuthManager() {
    const nome = 'AuthManager';
    
    if (typeof AuthManager === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['checkAuth', 'logout', 'redirectToLogin', 'redirectToDashboard'];
    
    for (const metodo of metodos) {
        if (typeof AuthManager[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    return { nome, sucesso: true, mensagem: 'Gerenciador de autenticação configurado' };
}

function testOrcamentoManager() {
    const nome = 'OrcamentoManager';
    
    if (typeof OrcamentoManager === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['salvarNovoOrcamento', 'atualizarStatus', 'gerarPDF'];
    
    for (const metodo of metodos) {
        if (typeof OrcamentoManager[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    return { nome, sucesso: true, mensagem: 'Gerenciador de orçamentos configurado' };
}

function testConfigManager() {
    const nome = 'ConfigManager';
    
    if (typeof ConfigManager === 'undefined') {
        return { nome, sucesso: false, mensagem: 'Classe não encontrada' };
    }
    
    const metodos = ['get', 'getApiUrl', 'isProduction', 'isDevelopment'];
    
    for (const metodo of metodos) {
        if (typeof ConfigManager[metodo] !== 'function') {
            return { nome, sucesso: false, mensagem: `Método ${metodo}() não encontrado` };
        }
    }
    
    return { nome, sucesso: true, mensagem: 'Gerenciador de configuração funcionando' };
}

function testElementosDOM() {
    const nome = 'Elementos DOM Essenciais';
    
    const elementosEssenciais = [
        'corpoTabela',
        'totalOrcamentos',
        'orcamentosPendentes',
        'orcamentosAceitos',
        'valorTotalPendente'
    ];
    
    const elementosFaltando = [];
    
    elementosEssenciais.forEach(id => {
        if (!document.getElementById(id)) {
            elementosFaltando.push(id);
        }
    });
    
    if (elementosFaltando.length > 0) {
        return { nome, sucesso: false, mensagem: `Elementos não encontrados: ${elementosFaltando.join(', ')}` };
    }
    
    return { nome, sucesso: true, mensagem: 'Todos os elementos DOM essenciais encontrados' };
}

function testAcessibilidade() {
    const nome = 'Acessibilidade';
    
    const checks = [];
    
    // Verificar atributos ARIA
    const elementosComAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-hidden]');
    if (elementosComAria.length === 0) {
        checks.push('Nenhum atributo ARIA encontrado');
    }
    
    // Verificar elementos de formulário com labels
    const inputs = document.querySelectorAll('input, select, textarea');
    let inputsSemLabel = 0;
    inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
            inputsSemLabel++;
        }
    });
    
    if (inputsSemLabel > 0) {
        checks.push(`${inputsSemLabel} inputs sem label adequado`);
    }
    
    // Verificar headings em ordem
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
        checks.push('Nenhum heading encontrado');
    }
    
    if (checks.length > 0) {
        return { nome, sucesso: false, mensagem: checks.join('; ') };
    }
    
    return { nome, sucesso: true, mensagem: 'Verificações básicas de acessibilidade passaram' };
}

function testResponsividade() {
    const nome = 'Responsividade';
    
    const viewport = window.innerWidth;
    const checks = [];
    
    // Verificar meta viewport
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
        checks.push('Meta viewport não encontrada');
    }
    
    // Verificar CSS responsivo
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    let temCssResponsivo = false;
    
    stylesheets.forEach(link => {
        if (link.href.includes('improvements') || link.href.includes('responsive')) {
            temCssResponsivo = true;
        }
    });
    
    if (!temCssResponsivo) {
        checks.push('CSS responsivo não detectado');
    }
    
    // Verificar classes responsivas no CSS
    const hasResponsiveClasses = document.querySelector('.table-responsive') !== null;
    if (!hasResponsiveClasses) {
        checks.push('Classes responsivas não encontradas');
    }
    
    if (checks.length > 0) {
        return { nome, sucesso: false, mensagem: checks.join('; ') };
    }
    
    return { nome, sucesso: true, mensagem: 'Verificações de responsividade passaram' };
}

// ========== TESTES DE PERFORMANCE ==========

function testPerformance() {
    const nome = 'Performance';
    
    const inicio = performance.now();
    
    // Simular operações comuns
    for (let i = 0; i < 1000; i++) {
        Utils.formatCurrency(Math.random() * 10000);
        Utils.formatDate(new Date().toISOString());
    }
    
    const fim = performance.now();
    const tempo = fim - inicio;
    
    if (tempo > 100) { // Mais de 100ms é considerado lento
        return { nome, sucesso: false, mensagem: `Operações muito lentas: ${tempo.toFixed(2)}ms` };
    }
    
    return { nome, sucesso: true, mensagem: `Performance adequada: ${tempo.toFixed(2)}ms` };
}

// ========== TESTES DE INTEGRAÇÃO ==========

function testIntegracao() {
    const nome = 'Integração entre Componentes';
    
    try {
        // Teste de criar orçamento fictício
        const dadosOrcamento = {
            paciente_id: 'TEST001',
            procedimento_principal: 'Teste',
            valor_total: 1000,
            data_consulta: '2025-08-01',
            validade: '2025-09-01',
            forma_pagamento: 'vista'
        };
        
        // Validar dados
        FormValidator.validateOrcamento(dadosOrcamento);
        
        // Simular salvamento (sem executar realmente)
        const novoId = Utils.generateId('ORC');
        
        // Verificar se componentes funcionam juntos
        if (!novoId.startsWith('ORC_')) {
            return { nome, sucesso: false, mensagem: 'Integração entre Utils e validação falhou' };
        }
        
    } catch (error) {
        return { nome, sucesso: false, mensagem: `Erro na integração: ${error.message}` };
    }
    
    return { nome, sucesso: true, mensagem: 'Componentes integrados corretamente' };
}

// ========== FUNÇÃO PARA EXECUTAR TESTE ESPECÍFICO ==========

function executarTeste(nomeTeste) {
    const testes = {
        notification: testNotificationManager,
        validator: testFormValidator,
        api: testApiManager,
        utils: testUtils,
        auth: testAuthManager,
        orcamento: testOrcamentoManager,
        config: testConfigManager,
        dom: testElementosDOM,
        acessibilidade: testAcessibilidade,
        responsividade: testResponsividade,
        performance: testPerformance,
        integracao: testIntegracao
    };
    
    if (!testes[nomeTeste]) {
        console.log(`❌ Teste '${nomeTeste}' não encontrado`);
        console.log('Testes disponíveis:', Object.keys(testes).join(', '));
        return;
    }
    
    const resultado = testes[nomeTeste]();
    const status = resultado.sucesso ? '✅' : '❌';
    console.log(`${status} ${resultado.nome}: ${resultado.mensagem}`);
    
    return resultado;
}

// ========== FUNÇÃO PARA MOSTRAR AJUDA ==========

function mostrarAjuda() {
    console.log(`
🧪 SISTEMA DE TESTES - GESTÃO DR. MARCIO SCARTOZZONI

Comandos disponíveis:

📊 executarTodosOsTestes()     - Executa todos os testes
🎯 executarTeste('nome')       - Executa teste específico
❓ mostrarAjuda()              - Mostra esta ajuda

Testes disponíveis:
• notification     - Sistema de notificações
• validator        - Sistema de validação
• api             - Gerenciador de API
• utils           - Utilitários
• auth            - Autenticação
• orcamento       - Gerenciador de orçamentos
• config          - Configurações
• dom             - Elementos DOM
• acessibilidade  - Verificações de acessibilidade
• responsividade  - Verificações responsivas
• performance     - Testes de performance
• integracao      - Testes de integração

Exemplo de uso:
executarTeste('notification');
executarTodosOsTestes();
    `);
}

// ========== AUTO-EXECUÇÃO EM DESENVOLVIMENTO ==========

// Se estivermos em modo de desenvolvimento, mostrar ajuda
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🧪 Sistema de testes carregado! Digite mostrarAjuda() para ver os comandos.');
}

// Exportar funções para uso externo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        executarTodosOsTestes,
        executarTeste,
        mostrarAjuda,
        testNotificationManager,
        testFormValidator,
        testApiManager,
        testUtils,
        testAuthManager,
        testOrcamentoManager,
        testConfigManager,
        testElementosDOM,
        testAcessibilidade,
        testResponsividade,
        testPerformance,
        testIntegracao
    };
}
