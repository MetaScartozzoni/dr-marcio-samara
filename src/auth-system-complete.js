/**
 * SISTEMA COMPLETO DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * Portal Dr. Marcio - Gestão de Funcionários
 * 
 * Fluxo Completo:
 * 1. Cadastro de funcionário → Email de confirmação com código
 * 2. Verificação do código → Ativação da conta
 * 3. Criação de senha → Conta ativa
 * 4. Login → Verificação de autorização
 * 5. Redirecionamento para dashboard correto
 */

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuthSystemComplete {
    constructor(googleSheetsService, sendGridService) {
        this.sheets = googleSheetsService;
        this.sendGrid = sendGridService;
        this.spreadsheetId = process.env.SPREADSHEET_ID;
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    async lerPlanilha(aba) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${aba}!A:Z`
            });

            const rows = response.data.values;
            if (!rows || rows.length < 2) return [];

            const headers = rows[0];
            return rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        } catch (error) {
            console.error(`Erro ao ler planilha ${aba}:`, error);
            return [];
        }
    }

    async adicionarLinhaPlanilha(aba, dados) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${aba}!A:Z`,
                valueInputOption: 'RAW',
                resource: {
                    values: [Object.values(dados)]
                }
            });
            return true;
        } catch (error) {
            console.error(`Erro ao adicionar linha na planilha ${aba}:`, error);
            return false;
        }
    }

    async atualizarLinhaPlanilha(aba, indice, dados) {
        try {
            const range = `${aba}!A${indice + 2}:Z${indice + 2}`;
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: [Object.values(dados)]
                }
            });
            return true;
        } catch (error) {
            console.error(`Erro ao atualizar linha na planilha ${aba}:`, error);
            return false;
        }
    }

    // ==================== CADASTRO DE FUNCIONÁRIO ====================

    async cadastrarFuncionario(dados) {
        try {
            const {
                nome, email, cpf, telefone, data_nascimento,
                endereco, cargo
            } = dados;

            // Validações básicas
            if (!nome || !email || !cpf) {
                return { sucesso: false, erro: 'Dados obrigatórios não informados' };
            }

            // Verificar se já existe
            const funcionarios = await this.lerPlanilha('Funcionarios');
            if (funcionarios.find(f => f.email === email)) {
                return { sucesso: false, erro: 'Email já cadastrado' };
            }
            if (funcionarios.find(f => f.cpf === cpf)) {
                return { sucesso: false, erro: 'CPF já cadastrado' };
            }

            // Gerar código de verificação
            const codigoVerificacao = this.gerarCodigoVerificacao();
            const expiracaoCodigo = new Date();
            expiracaoCodigo.setMinutes(expiracaoCodigo.getMinutes() + 5);

            // Preparar dados para salvamento
            const funcionarioData = {
                nome: nome.trim(),
                email: email.toLowerCase().trim(),
                cpf: cpf.replace(/\D/g, ''),
                telefone: telefone || '',
                data_nascimento: data_nascimento || '',
                endereco: endereco || '',
                cargo: cargo || '',
                tipo: 'funcionario',
                status: 'pendente_verificacao',
                data_cadastro: new Date().toISOString(),
                codigo_verificacao: codigoVerificacao,
                expiracao_codigo: expiracaoCodigo.toISOString(),
                tentativas_codigo: '0',
                hash_senha: '',
                data_ultimo_login: '',
                data_autorizacao: ''
            };

            // Salvar na planilha
            const salvou = await this.adicionarLinhaPlanilha('Funcionarios', funcionarioData);
            
            if (!salvou) {
                return { sucesso: false, erro: 'Erro ao salvar dados' };
            }

            // Enviar email de confirmação
            await this.enviarEmailConfirmacao(email, nome, codigoVerificacao);

            // Notificar admin
            await this.notificarAdminNovoFuncionario(funcionarioData);

            return {
                sucesso: true,
                mensagem: 'Cadastro realizado! Verifique seu email para confirmar.',
                usuario: {
                    nome: funcionarioData.nome,
                    email: funcionarioData.email,
                    status: funcionarioData.status
                }
            };

        } catch (error) {
            console.error('Erro no cadastro:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // ==================== VERIFICAÇÃO DE EMAIL ====================

    async verificarCodigo(email, codigo) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            
            if (funcionarioIndex === -1) {
                return { sucesso: false, erro: 'Usuário não encontrado' };
            }

            const funcionario = funcionarios[funcionarioIndex];

            // Verificar status
            if (funcionario.status !== 'pendente_verificacao') {
                return { sucesso: false, erro: 'Código já foi verificado ou conta inválida' };
            }

            // Verificar expiração
            const agora = new Date();
            const expiracao = new Date(funcionario.expiracao_codigo);
            
            if (agora > expiracao) {
                return { sucesso: false, erro: 'Código expirado. Solicite um novo.' };
            }

            // Verificar tentativas
            const tentativas = parseInt(funcionario.tentativas_codigo) || 0;
            if (tentativas >= 3) {
                return { sucesso: false, erro: 'Muitas tentativas. Solicite um novo código.' };
            }

            // Verificar código
            if (funcionario.codigo_verificacao !== codigo) {
                // Incrementar tentativas
                funcionario.tentativas_codigo = (tentativas + 1).toString();
                await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);
                
                return { 
                    sucesso: false, 
                    erro: `Código incorreto. Tentativas restantes: ${3 - tentativas - 1}` 
                };
            }

            // Código correto - atualizar status
            funcionario.status = 'email_verificado';
            funcionario.codigo_verificacao = '';
            funcionario.expiracao_codigo = '';
            funcionario.tentativas_codigo = '0';

            await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);

            return {
                sucesso: true,
                mensagem: 'Email verificado com sucesso!',
                usuario: {
                    nome: funcionario.nome,
                    email: funcionario.email,
                    status: funcionario.status
                }
            };

        } catch (error) {
            console.error('Erro na verificação do código:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    async reenviarCodigo(email) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            
            if (funcionarioIndex === -1) {
                return { sucesso: false, erro: 'Usuário não encontrado' };
            }

            const funcionario = funcionarios[funcionarioIndex];

            if (funcionario.status !== 'pendente_verificacao') {
                return { sucesso: false, erro: 'Verificação já realizada ou conta inválida' };
            }

            // Gerar novo código
            const novoCodigo = this.gerarCodigoVerificacao();
            const novaExpiracao = new Date();
            novaExpiracao.setMinutes(novaExpiracao.getMinutes() + 5);

            // Atualizar dados
            funcionario.codigo_verificacao = novoCodigo;
            funcionario.expiracao_codigo = novaExpiracao.toISOString();
            funcionario.tentativas_codigo = '0';

            await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);

            // Enviar novo email
            await this.enviarEmailConfirmacao(email, funcionario.nome, novoCodigo);

            return {
                sucesso: true,
                mensagem: 'Novo código enviado para seu email!'
            };

        } catch (error) {
            console.error('Erro ao reenviar código:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // ==================== CRIAÇÃO DE SENHA ====================

    async criarSenha(email, senha, confirmarSenha) {
        try {
            // Validações
            if (senha !== confirmarSenha) {
                return { sucesso: false, erro: 'Senhas não coincidem' };
            }

            if (senha.length < 8) {
                return { sucesso: false, erro: 'Senha deve ter pelo menos 8 caracteres' };
            }

            // Verificar complexidade da senha
            const regexComplexidade = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
            if (!regexComplexidade.test(senha)) {
                return { 
                    sucesso: false, 
                    erro: 'Senha deve conter: letra minúscula, maiúscula, número e símbolo' 
                };
            }

            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            
            if (funcionarioIndex === -1) {
                return { sucesso: false, erro: 'Usuário não encontrado' };
            }

            const funcionario = funcionarios[funcionarioIndex];

            if (funcionario.status !== 'email_verificado') {
                return { sucesso: false, erro: 'Email ainda não foi verificado' };
            }

            // Criar hash da senha
            const saltRounds = 12;
            const hashSenha = await bcrypt.hash(senha, saltRounds);

            // Atualizar funcionário
            funcionario.hash_senha = hashSenha;
            funcionario.status = 'aguardando_autorizacao';

            await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);

            // Enviar email de boas-vindas
            await this.enviarEmailBoasVindas(email, funcionario.nome);

            // Notificar admin para autorização
            await this.notificarAdminAutorizacaoPendente(funcionario);

            return {
                sucesso: true,
                mensagem: 'Senha criada! Aguarde autorização do administrador.',
                usuario: {
                    nome: funcionario.nome,
                    email: funcionario.email,
                    status: funcionario.status
                }
            };

        } catch (error) {
            console.error('Erro ao criar senha:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // ==================== LOGIN ====================

    async realizarLogin(email, senha) {
        try {
            // Verificação especial para status
            if (senha === 'check-status-only') {
                return await this.verificarStatusAutorizacao(email);
            }

            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { sucesso: false, erro: 'Email ou senha incorretos' };
            }

            // Verificar senha
            if (!funcionario.hash_senha) {
                return { sucesso: false, erro: 'Senha não foi definida' };
            }

            const senhaCorreta = await bcrypt.compare(senha, funcionario.hash_senha);
            if (!senhaCorreta) {
                return { sucesso: false, erro: 'Email ou senha incorretos' };
            }

            // Verificar status da conta
            const statusVerificacao = this.verificarStatusConta(funcionario);
            if (!statusVerificacao.podeLogar) {
                return {
                    sucesso: false,
                    erro: statusVerificacao.mensagem,
                    status: funcionario.status,
                    redirectTo: statusVerificacao.redirectTo
                };
            }

            // Atualizar último login
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            funcionario.data_ultimo_login = new Date().toISOString();
            await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);

            // Determinar dashboard
            const dashboard = this.determinarDashboard(funcionario);

            return {
                sucesso: true,
                mensagem: 'Login realizado com sucesso!',
                usuario: {
                    id: funcionario.email,
                    nome: funcionario.nome,
                    email: funcionario.email,
                    tipo: funcionario.tipo,
                    cargo: funcionario.cargo,
                    status: funcionario.status
                },
                redirectTo: dashboard
            };

        } catch (error) {
            console.error('Erro no login:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // ==================== VERIFICAÇÕES DE STATUS ====================

    verificarStatusConta(usuario) {
        switch (usuario.status) {
            case 'pendente_verificacao':
                return {
                    podeLogar: false,
                    mensagem: 'Email ainda não foi verificado',
                    redirectTo: 'verificar-email.html'
                };
            
            case 'email_verificado':
                return {
                    podeLogar: false,
                    mensagem: 'Senha ainda não foi criada',
                    redirectTo: 'criar-senha.html'
                };
            
            case 'aguardando_autorizacao':
                return {
                    podeLogar: false,
                    mensagem: 'Aguardando autorização do administrador',
                    redirectTo: 'aguardando-autorizacao.html'
                };
            
            case 'nao_autorizado':
                return {
                    podeLogar: false,
                    mensagem: 'Acesso negado pelo administrador',
                    redirectTo: 'login.html'
                };
            
            case 'suspenso':
                return {
                    podeLogar: false,
                    mensagem: 'Conta suspensa. Entre em contato com o administrador',
                    redirectTo: 'login.html'
                };
            
            case 'ativo':
                return {
                    podeLogar: true,
                    mensagem: 'Conta ativa'
                };
            
            default:
                return {
                    podeLogar: false,
                    mensagem: 'Status de conta inválido',
                    redirectTo: 'login.html'
                };
        }
    }

    determinarDashboard(usuario) {
        switch (usuario.tipo) {
            case 'admin':
                return 'dashboard.html';
            case 'funcionario':
                return 'dashboard-funcionario.html';
            case 'patient':
                return 'dashboard-paciente.html';
            default:
                return 'dashboard.html';
        }
    }

    // ==================== AUTORIZAÇÃO DE FUNCIONÁRIOS ====================

    async autorizarFuncionario(emailFuncionario, acao) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === emailFuncionario);
            
            if (funcionarioIndex === -1) {
                return { sucesso: false, erro: 'Funcionário não encontrado' };
            }

            const funcionario = funcionarios[funcionarioIndex];
            
            // Validar ações
            const acoes = {
                'approve': 'ativo',
                'reject': 'nao_autorizado',
                'suspend': 'suspenso',
                'reactivate': 'ativo'
            };

            const novoStatus = acoes[acao];
            if (!novoStatus) {
                return { sucesso: false, erro: 'Ação inválida' };
            }

            // Atualizar status
            funcionario.status = novoStatus;
            funcionario.data_autorizacao = new Date().toISOString();

            await this.atualizarLinhaPlanilha('Funcionarios', funcionarioIndex, funcionario);

            // Enviar email de notificação
            await this.enviarEmailAutorizacao(funcionario, acao);

            const mensagens = {
                'approve': 'Funcionário aprovado com sucesso!',
                'reject': 'Funcionário rejeitado',
                'suspend': 'Funcionário suspenso',
                'reactivate': 'Funcionário reativado'
            };

            return { 
                sucesso: true, 
                mensagem: mensagens[acao],
                funcionario: funcionario
            };

        } catch (error) {
            console.error('Erro ao autorizar funcionário:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // ==================== LISTAGEM E CONSULTAS ====================

    async listarSolicitacoes() {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            
            // Filtrar e formatar dados para retorno
            const solicitacoes = funcionarios.map(funcionario => ({
                id: funcionario.email,
                nome: funcionario.nome,
                email: funcionario.email,
                cpf: funcionario.cpf,
                telefone: funcionario.telefone,
                data_nascimento: funcionario.data_nascimento,
                endereco: funcionario.endereco,
                cargo: funcionario.cargo,
                tipo: funcionario.tipo || 'funcionario',
                status: funcionario.status,
                data_cadastro: funcionario.data_cadastro,
                data_autorizacao: funcionario.data_autorizacao
            }));

            return { 
                sucesso: true, 
                solicitacoes: solicitacoes
            };

        } catch (error) {
            console.error('Erro ao listar solicitações:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    async verificarStatusAutorizacao(email) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { sucesso: false, erro: 'Funcionário não encontrado' };
            }

            return { 
                sucesso: funcionario.status === 'ativo',
                status: funcionario.status,
                usuario: {
                    nome: funcionario.nome,
                    email: funcionario.email,
                    tipo: funcionario.tipo || 'funcionario',
                    status: funcionario.status
                },
                redirectTo: funcionario.status === 'ativo' ? this.determinarDashboard(funcionario) : null
            };

        } catch (error) {
            console.error('Erro ao verificar status:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    async verificarStatusFuncionario(email) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { 
                    existe: false,
                    temSenha: false,
                    aprovado: false,
                    status: 'nao_encontrado'
                };
            }

            // Verificar se tem senha (hash_senha não vazio)
            const temSenha = funcionario.hash_senha && funcionario.hash_senha.trim() !== '';
            
            // Verificar se está aprovado (status = 'ativo')
            const aprovado = funcionario.status === 'ativo';

            return { 
                existe: true,
                temSenha: temSenha,
                aprovado: aprovado,
                status: funcionario.status,
                usuario: {
                    nome: funcionario.nome,
                    email: funcionario.email,
                    tipo: funcionario.tipo || 'funcionario'
                }
            };

        } catch (error) {
            console.error('Erro ao verificar status do funcionário:', error);
            return { 
                existe: false,
                temSenha: false,
                aprovado: false,
                status: 'erro',
                erro: 'Erro interno do servidor'
            };
        }
    }

    // ==================== UTILITÁRIOS ====================

    gerarCodigoVerificacao() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // ==================== EMAILS ====================

    async enviarEmailConfirmacao(email, nome, codigo) {
        try {
            const templateEmail = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">Portal Dr. Marcio</h1>
                        <p style="margin: 10px 0 0; font-size: 16px;">Confirmação de Email</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Recebemos sua solicitação de cadastro como funcionário no Portal Dr. Marcio.
                            Para confirmar seu email, use o código abaixo:
                        </p>
                        
                        <div style="background: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                            <div style="font-size: 36px; font-weight: bold; color: #007bff; letter-spacing: 5px; font-family: monospace;">
                                ${codigo}
                            </div>
                            <p style="color: #666; margin: 15px 0 0; font-size: 14px;">
                                Este código expira em 5 minutos
                            </p>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                <strong>Importante:</strong> Se você não solicitou este cadastro, ignore este email.
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>Portal Dr. Marcio - Sistema de Gestão</p>
                        <p>Este é um email automático, não responda.</p>
                    </div>
                </div>
            `;

            const msg = {
                to: email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: 'Confirme seu email - Portal Dr. Marcio',
                html: templateEmail
            };

            await this.sendGrid.send(msg);
            console.log('Email de confirmação enviado para:', email);

        } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error);
        }
    }

    async enviarEmailBoasVindas(email, nome) {
        try {
            const templateEmail = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🎉 Bem-vindo!</h1>
                        <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Parabéns! Sua conta foi criada com sucesso no Portal Dr. Marcio.
                            Agora aguarde a autorização do administrador para ter acesso completo ao sistema.
                        </p>
                        
                        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px; color: #155724;">Próximos Passos:</h3>
                            <ol style="margin: 0; color: #155724;">
                                <li>Aguarde a aprovação do administrador</li>
                                <li>Você receberá um email quando sua conta for aprovada</li>
                                <li>Após aprovação, faça login no sistema</li>
                            </ol>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h4 style="margin: 0 0 10px; color: #333;">Dados da sua conta:</h4>
                            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Aguardando autorização</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>Portal Dr. Marcio - Sistema de Gestão</p>
                        <p>Em caso de dúvidas, entre em contato conosco.</p>
                    </div>
                </div>
            `;

            const msg = {
                to: email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: 'Bem-vindo ao Portal Dr. Marcio!',
                html: templateEmail
            };

            await this.sendGrid.send(msg);
            console.log('Email de boas-vindas enviado para:', email);

        } catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error);
        }
    }

    async notificarAdminNovoFuncionario(funcionario) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@drmarcio.com.br';
            
            const templateEmail = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">⚠️ Nova Solicitação</h1>
                        <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio - Admin</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Novo Funcionário Cadastrado</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Um novo funcionário se cadastrou no sistema e aguarda autorização.
                        </p>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px; color: #333;">Dados do funcionário:</h4>
                            <p style="margin: 5px 0; color: #666;"><strong>Nome:</strong> ${funcionario.nome}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${funcionario.email}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>CPF:</strong> ${funcionario.cpf}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Cargo:</strong> ${funcionario.cargo}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Data do cadastro:</strong> ${new Date(funcionario.data_cadastro).toLocaleString('pt-BR')}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL}/admin-autorizacoes.html" 
                               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Gerenciar Autorizações
                            </a>
                        </div>
                    </div>
                </div>
            `;

            const msg = {
                to: adminEmail,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: '[Portal Dr. Marcio] Nova solicitação de funcionário',
                html: templateEmail
            };

            await this.sendGrid.send(msg);
            console.log('Admin notificado sobre novo funcionário:', funcionario.email);

        } catch (error) {
            console.error('Erro ao notificar admin:', error);
        }
    }

    async notificarAdminAutorizacaoPendente(funcionario) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@drmarcio.com.br';
            
            const templateEmail = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">⏳ Autorização Pendente</h1>
                        <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio - Admin</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Funcionário Pronto para Autorização</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            O funcionário ${funcionario.nome} completou seu cadastro e criou sua senha.
                            A conta está pronta para autorização.
                        </p>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
                            <h4 style="margin: 0 0 15px; color: #856404;">Status do processo:</h4>
                            <ul style="margin: 0; color: #856404;">
                                <li>✅ Email verificado</li>
                                <li>✅ Senha criada</li>
                                <li>⏳ Aguardando autorização do admin</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL}/admin-autorizacoes.html" 
                               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Autorizar Agora
                            </a>
                        </div>
                    </div>
                </div>
            `;

            const msg = {
                to: adminEmail,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: '[Portal Dr. Marcio] Funcionário pronto para autorização',
                html: templateEmail
            };

            await this.sendGrid.send(msg);

        } catch (error) {
            console.error('Erro ao notificar admin sobre autorização pendente:', error);
        }
    }

    async enviarEmailAutorizacao(funcionario, acao) {
        try {
            let templateEmail = '';
            let subject = '';

            if (acao === 'approve') {
                subject = 'Conta Aprovada - Portal Dr. Marcio';
                templateEmail = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">🎉 Conta Aprovada!</h1>
                            <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                            <h2 style="color: #333; margin-top: 0;">Parabéns, ${funcionario.nome}!</h2>
                            
                            <p style="color: #666; line-height: 1.6;">
                                Sua conta foi aprovada pelo administrador! Agora você tem acesso completo ao Portal Dr. Marcio.
                            </p>
                            
                            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
                                <h3 style="margin: 0 0 10px; color: #155724;">Você já pode:</h3>
                                <ul style="margin: 0; color: #155724;">
                                    <li>Fazer login no sistema</li>
                                    <li>Acessar seu dashboard</li>
                                    <li>Utilizar todas as funcionalidades disponíveis</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.SITE_URL}/login.html" 
                                   style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                    Fazer Login
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                subject = 'Atualização da Conta - Portal Dr. Marcio';
                const statusMessages = {
                    'reject': { color: '#dc3545', message: 'Sua solicitação de acesso foi rejeitada.' },
                    'suspend': { color: '#ffc107', message: 'Sua conta foi temporariamente suspensa.' },
                    'reactivate': { color: '#28a745', message: 'Sua conta foi reativada!' }
                };
                
                const statusInfo = statusMessages[acao];
                templateEmail = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: ${statusInfo.color}; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px;">Atualização da Conta</h1>
                            <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                            <h2 style="color: #333; margin-top: 0;">Olá, ${funcionario.nome}</h2>
                            <p style="color: #666; line-height: 1.6;">${statusInfo.message}</p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #666;">Para mais informações, entre em contato com o administrador.</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            const msg = {
                to: funcionario.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: subject,
                html: templateEmail
            };

            await this.sendGrid.send(msg);
            console.log(`Email de ${acao} enviado para:`, funcionario.email);

        } catch (error) {
            console.error('Erro ao enviar email de autorização:', error);
        }
    }

    // Método para listar funcionários pendentes de autorização
    async listarFuncionariosPendentes() {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionariosPendentes = funcionarios.filter(f => 
                f.status === 'pendente_autorizacao'
            );
            const solicitacoes = funcionarios.map(funcionario => ({
                id: funcionario.email,
                nome: funcionario.nome,
                email: funcionario.email,
                cpf: funcionario.cpf,
                telefone: funcionario.telefone,
                data_nascimento: funcionario.data_nascimento,
                endereco: funcionario.endereco,
                cargo: funcionario.cargo,
                tipo: funcionario.tipo || 'funcionario',
                status: funcionario.status,
                data_cadastro: funcionario.data_cadastro,
                data_autorizacao: funcionario.data_autorizacao
            }));

            return { 
                sucesso: true, 
                solicitacoes: solicitacoes
            };

        } catch (error) {
            console.error('Erro ao listar solicitações:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }

    // Método para verificar status de autorização sem senha
    async verificarStatusAutorizacao(email) {
        try {
            const funcionarios = await this.lerPlanilha('Funcionarios');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { sucesso: false, erro: 'Funcionário não encontrado' };
            }

            return { 
                sucesso: true, 
                status: funcionario.status,
                usuario: {
                    nome: funcionario.nome,
                    email: funcionario.email,
                    tipo: funcionario.tipo || 'funcionario',
                    status: funcionario.status
                }
            };

        } catch (error) {
            console.error('Erro ao verificar status:', error);
            return { sucesso: false, erro: 'Erro interno do servidor' };
        }
    }
}

module.exports = AuthSystemComplete;
