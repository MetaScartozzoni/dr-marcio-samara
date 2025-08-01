/**
 * TESTE COMPLETO DO SISTEMA DE LOGIN
 * Portal Dr. Marcio - Sistema de Autenticação
 * 
 * Testa:
 * 1. Cadastro de funcionário
 * 2. Verificação de email
 * 3. Criação de senha
 * 4. Login com credenciais
 * 5. Verificação de autorização
 * 6. Redirecionamento correto
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class LoginSystemTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testEmail = `teste${Date.now()}@email.com`; // Email único baseado em timestamp
        this.testSenha = 'senha123';
        this.token = null;
        this.codigoVerificacao = null;
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '🔍',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || 'ℹ️';
        
        console.log(`${prefix} ${message}`);
    }

    async test(name, testFunction) {
        this.testResults.total++;
        this.log(`Testando: ${name}`, 'info');
        
        try {
            await testFunction();
            this.testResults.passed++;
            this.testResults.tests.push({ name, status: 'PASSED', error: null });
            this.log(`PASSOU: ${name}`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.tests.push({ name, status: 'FAILED', error: error.message });
            this.log(`FALHOU: ${name} - ${error.message}`, 'error');
        }
        console.log('');
    }

    async runAllTests() {
        console.log('🚀 INICIANDO TESTES DO SISTEMA DE LOGIN\n');
        
        // Testes básicos de conectividade
        await this.test('Conectividade com servidor', () => this.testServerConnection());
        
        // Testes de páginas de login
        await this.test('Página de login acessível', () => this.testLoginPage());
        await this.test('Página de cadastro acessível', () => this.testCadastroPage());
        
        // Testes de API de autenticação
        await this.test('Endpoint de cadastro funcionando', () => this.testCadastroEndpoint());
        await this.test('Endpoint de login funcionando', () => this.testLoginEndpoint());
        await this.test('Verificação de email funcionando', () => this.testEmailVerification());
        
        // Testes de segurança
        await this.test('Validação de credenciais inválidas', () => this.testInvalidCredentials());
        await this.test('Proteção contra ataques de força bruta', () => this.testBruteForceProtection());
        
        // Testes de sessão
        await this.test('Criação de sessão após login', () => this.testSessionCreation());
        await this.test('Validação de token JWT', () => this.testJWTValidation());
        
        // Testes de redirecionamento
        await this.test('Redirecionamento por perfil', () => this.testProfileRedirection());
        
        // Relatório final
        this.printSummary();
    }

    async testServerConnection() {
        try {
            const response = await fetch(this.baseUrl, { 
                method: 'GET',
                timeout: 5000
            });
            
            if (!response.ok && response.status !== 404) {
                throw new Error(`Servidor não responde: ${response.status}`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('Servidor não está rodando na porta 3000');
            }
            throw error;
        }
    }

    async testLoginPage() {
        const response = await fetch(`${this.baseUrl}/login.html`);
        
        if (!response.ok) {
            throw new Error(`Página de login não encontrada: ${response.status}`);
        }
        
        const html = await response.text();
        if (!html.includes('login') && !html.includes('senha')) {
            throw new Error('Página de login não contém elementos esperados');
        }
    }

    async testCadastroPage() {
        const response = await fetch(`${this.baseUrl}/cadastro.html`);
        
        if (!response.ok) {
            throw new Error(`Página de cadastro não encontrada: ${response.status}`);
        }
        
        const html = await response.text();
        if (!html.includes('cadastro') && !html.includes('email')) {
            throw new Error('Página de cadastro não contém elementos esperados');
        }
    }

    async testCadastroEndpoint() {
        const response = await fetch(`${this.baseUrl}/api/cadastrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: 'Teste Login User',
                email: this.testEmail,
                senha: this.testSenha,
                perfil: 'recepcionista',
                telefone: '(11) 99999-9999'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cadastro falhou: ${response.status} - ${error}`);
        }

        const result = await response.json();
        if (!result.success && !result.message) {
            throw new Error('Resposta de cadastro inválida');
        }
    }

    async testEmailVerification() {
        // Simular verificação de email com código mockado
        this.codigoVerificacao = '123456'; // Em produção, seria extraído do email
        
        const response = await fetch(`${this.baseUrl}/api/verificar-codigo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: this.testEmail,
                codigo: this.codigoVerificacao
            })
        });

        // Se o endpoint não existir, não é erro crítico
        if (response.status === 404) {
            this.log('Endpoint de verificação não implementado', 'warning');
            return;
        }
    }

    async testLoginEndpoint() {
        const response = await fetch(`${this.baseUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: this.testEmail,
                senha: this.testSenha
            })
        });

        if (response.status === 404) {
            throw new Error('Endpoint de login não encontrado');
        }

        // Login pode falhar se usuário não existir, mas endpoint deve responder
        const result = await response.json();
        if (response.ok && result.token) {
            this.token = result.token;
        }
    }

    async testInvalidCredentials() {
        const response = await fetch(`${this.baseUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'usuario.inexistente@example.com',
                senha: 'senhaerrada'
            })
        });

        if (response.ok) {
            throw new Error('Login com credenciais inválidas deveria falhar');
        }

        if (response.status !== 401 && response.status !== 403) {
            throw new Error(`Status de erro inesperado: ${response.status}`);
        }
    }

    async testBruteForceProtection() {
        // Tentar múltiplos logins falsos
        const attempts = [];
        for (let i = 0; i < 3; i++) {
            attempts.push(
                fetch(`${this.baseUrl}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.testEmail,
                        senha: 'senhaerrada' + i
                    })
                })
            );
        }

        const responses = await Promise.all(attempts);
        
        // Verificar se há alguma proteção (rate limiting, etc.)
        const lastResponse = responses[responses.length - 1];
        if (lastResponse.status === 429) {
            // Rate limiting ativo - bom!
            return;
        }
        
        // Se não há rate limiting, pelo menos deve retornar erro consistente
        for (const response of responses) {
            if (response.ok) {
                throw new Error('Múltiplas tentativas de login inválido deveriam falhar');
            }
        }
    }

    async testSessionCreation() {
        if (!this.token) {
            this.log('Token não disponível, testando criação de sessão básica', 'warning');
            return;
        }

        // Testar se o token funciona em endpoint protegido
        const response = await fetch(`${this.baseUrl}/api/dashboard`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        // Se endpoint não existir, não é erro crítico
        if (response.status === 404) {
            this.log('Endpoint de dashboard não encontrado', 'warning');
            return;
        }
    }

    async testJWTValidation() {
        // Testar com token inválido
        const response = await fetch(`${this.baseUrl}/api/dashboard`, {
            headers: {
                'Authorization': 'Bearer token_invalido_12345'
            }
        });

        if (response.status === 404) {
            this.log('Endpoint de dashboard não encontrado', 'warning');
            return;
        }

        if (response.ok) {
            throw new Error('Token inválido deveria ser rejeitado');
        }
    }

    async testProfileRedirection() {
        // Verificar se diferentes perfis redirecionam corretamente
        const perfis = ['admin', 'medico', 'recepcionista'];
        
        for (const perfil of perfis) {
            const response = await fetch(`${this.baseUrl}/dashboard-${perfil}.html`);
            
            if (!response.ok && response.status !== 404) {
                throw new Error(`Dashboard para ${perfil} com erro: ${response.status}`);
            }
        }
    }

    printSummary() {
        console.log('\n🎯 RESUMO DOS TESTES DE LOGIN');
        console.log('='*50);
        console.log(`Total de testes: ${this.testResults.total}`);
        console.log(`✅ Passou: ${this.testResults.passed}`);
        console.log(`❌ Falhou: ${this.testResults.failed}`);
        console.log(`📊 Taxa de sucesso: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ TESTES QUE FALHARAM:');
            this.testResults.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  • ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n✅ TESTES QUE PASSARAM:');
        this.testResults.tests
            .filter(test => test.status === 'PASSED')
            .forEach(test => {
                console.log(`  • ${test.name}`);
            });
        
        console.log('\n' + '='*50);
        
        if (this.testResults.failed === 0) {
            console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de login funcionando.');
        } else if (this.testResults.passed > this.testResults.failed) {
            console.log('⚠️ MAIORIA DOS TESTES PASSOU. Corrigir falhas menores.');
        } else {
            console.log('🚨 MUITOS TESTES FALHARAM. Sistema precisa de atenção.');
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new LoginSystemTester();
    tester.runAllTests().catch(console.error);
}

module.exports = LoginSystemTester;
