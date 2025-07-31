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

const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuthSystemComplete {
    constructor(googleSheetsService, sendGridService) {
        this.sheets = googleSheetsService;
        this.sendGrid = sendGridService;
        this.spreadsheetId = process.env.SPREADSHEET_ID;
        
        // Serviços de email
        this.emailService = null;
        this.codigosVerificacao = new Map(); // Cache temporário para códigos
        
        // Inicializar serviço de email se disponível
        try {
            const EmailService = require('./src/services/email-sendgrid.service');
            this.emailService = new EmailService();
        } catch (error) {
            console.warn('⚠️ Serviço de email não disponível:', error.message);
        }
    }

    // ==================== MÉTODOS AUXILIARES ====================
    
    async lerPlanilha(aba) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${aba}!A:Z`
            });
            
            const values = response.data.values || [];
            if (values.length === 0) return [];
            
            const headers = values[0];
            const rows = values.slice(1);
            
            return rows.map(row => {
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
            const range = `${aba}!A:Z`;
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: range,
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
            const { email, nome, telefone, cpf, cargo, tipo = 'funcionario' } = dados;
            
            // Validações básicas
            if (!email || !nome) {
                return { 
                    sucesso: false, 
                    erro: 'Email e nome são obrigatórios' 
                };
            }

            // Verificar se já existe
            const funcionarios = await this.lerPlanilha('Usuario');
            const usuarioExiste = funcionarios.find(f => f.email === email);
            
            if (usuarioExiste) {
                return { 
                    sucesso: false, 
                    erro: 'Email já cadastrado no sistema' 
                };
            }

            // Gerar código de verificação de 6 dígitos
            const codigoVerificacao = this.gerarCodigoVerificacao();
            const user_id = 'USR_' + Date.now();
            
            // Salvar código temporariamente (5 minutos)
            this.codigosVerificacao.set(email, {
                codigo: codigoVerificacao,
                expiracao: Date.now() + (5 * 60 * 1000), // 5 minutos
                tentativas: 0,
                dados: { email, nome, telefone, cpf, cargo, tipo, user_id }
            });

            // Preparar dados do funcionário
            const funcionarioData = {
                user_id,
                email: email.toLowerCase().trim(),
                full_name: nome.trim(),
                telefone: telefone || '',
                cpf: cpf ? cpf.replace(/\D/g, '') : '',
                cargo: cargo || '',
                role: tipo,
                status: 'pendente_verificacao',
                autorizado: 'nao',
                codigo_verificacao: codigoVerificacao,
                created_at: new Date().toISOString(),
                verified_at: null,
                password_hash: null,
                last_login: null,
                observacoes: 'Cadastro via sistema de autenticação'
            };

            // Adicionar à planilha
            const salvou = await this.adicionarLinhaPlanilha('Usuario', funcionarioData);
            
            if (!salvou) {
                return { 
                    sucesso: false, 
                    erro: 'Erro ao salvar dados na planilha' 
                };
            }

            // Enviar email de confirmação
            const resultadoEmail = await this.enviarEmailConfirmacao(email, nome, codigoVerificacao);
            
            if (!resultadoEmail.sucesso) {
                console.error('Erro ao enviar email:', resultadoEmail.erro);
            }

            return {
                sucesso: true,
                mensagem: 'Funcionário cadastrado! Verifique o email para confirmar.',
                usuario: {
                    user_id,
                    nome: funcionarioData.full_name,
                    email: funcionarioData.email,
                    status: funcionarioData.status
                },
                emailEnviado: resultadoEmail.sucesso
            };

        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== VERIFICAÇÃO DE EMAIL ====================

    async verificarCodigo(email, codigo) {
        try {
            const dadosVerificacao = this.codigosVerificacao.get(email);
            
            if (!dadosVerificacao) {
                return { 
                    sucesso: false, 
                    erro: 'Código não encontrado ou expirado' 
                };
            }

            // Verificar expiração
            if (Date.now() > dadosVerificacao.expiracao) {
                this.codigosVerificacao.delete(email);
                return { 
                    sucesso: false, 
                    erro: 'Código expirado. Solicite um novo.' 
                };
            }

            // Verificar tentativas
            if (dadosVerificacao.tentativas >= 3) {
                this.codigosVerificacao.delete(email);
                return { 
                    sucesso: false, 
                    erro: 'Muitas tentativas. Solicite um novo código.' 
                };
            }

            // Verificar código
            if (dadosVerificacao.codigo !== codigo) {
                dadosVerificacao.tentativas++;
                return { 
                    sucesso: false, 
                    erro: `Código incorreto. Tentativas restantes: ${3 - dadosVerificacao.tentativas}` 
                };
            }

            // Código correto - atualizar usuário na planilha
            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            
            if (funcionarioIndex !== -1) {
                const funcionario = funcionarios[funcionarioIndex];
                funcionario.status = 'email_verificado';
                funcionario.verified_at = new Date().toISOString();
                funcionario.codigo_verificacao = '';
                
                await this.atualizarLinhaPlanilha('Usuario', funcionarioIndex, funcionario);
            }

            // Limpar código do cache
            this.codigosVerificacao.delete(email);

            return {
                sucesso: true,
                mensagem: 'Email verificado com sucesso! Agora crie sua senha.',
                proximoPasso: 'criar_senha'
            };

        } catch (error) {
            console.error('Erro ao verificar código:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== REENVIO DE CÓDIGO ====================

    async reenviarCodigo(email) {
        try {
            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { 
                    sucesso: false, 
                    erro: 'Usuário não encontrado' 
                };
            }

            if (funcionario.status !== 'pendente_verificacao') {
                return { 
                    sucesso: false, 
                    erro: 'Email já foi verificado ou conta não está pendente' 
                };
            }

            // Gerar novo código
            const novoCodigo = this.gerarCodigoVerificacao();
            
            // Atualizar cache
            this.codigosVerificacao.set(email, {
                codigo: novoCodigo,
                expiracao: Date.now() + (5 * 60 * 1000),
                tentativas: 0,
                dados: { email, nome: funcionario.full_name }
            });

            // Enviar novo email
            const resultadoEmail = await this.enviarEmailConfirmacao(email, funcionario.full_name, novoCodigo);

            return {
                sucesso: true,
                mensagem: 'Novo código enviado para seu email!',
                emailEnviado: resultadoEmail.sucesso
            };

        } catch (error) {
            console.error('Erro ao reenviar código:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== CRIAÇÃO DE SENHA ====================

    async criarSenha(email, senha, confirmarSenha) {
        try {
            // Validações
            if (!senha || senha.length < 6) {
                return { 
                    sucesso: false, 
                    erro: 'Senha deve ter pelo menos 6 caracteres' 
                };
            }

            if (senha !== confirmarSenha) {
                return { 
                    sucesso: false, 
                    erro: 'Senhas não coincidem' 
                };
            }

            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            
            if (funcionarioIndex === -1) {
                return { 
                    sucesso: false, 
                    erro: 'Usuário não encontrado' 
                };
            }

            const funcionario = funcionarios[funcionarioIndex];

            if (funcionario.status !== 'email_verificado') {
                return { 
                    sucesso: false, 
                    erro: 'Email não foi verificado ainda' 
                };
            }

            // Gerar hash da senha
            const senhaHash = await bcrypt.hash(senha, 12);

            // Atualizar funcionário
            funcionario.password_hash = senhaHash;
            funcionario.status = 'aguardando_autorizacao';
            funcionario.password_created_at = new Date().toISOString();
            
            await this.atualizarLinhaPlanilha('Usuario', funcionarioIndex, funcionario);

            // Enviar email de boas-vindas
            await this.enviarEmailBoasVindas(email, funcionario.full_name);

            // Notificar admin sobre novo funcionário
            await this.notificarAdminNovoFuncionario(funcionario);

            return {
                sucesso: true,
                mensagem: 'Conta criada com sucesso! Aguarde autorização do administrador.',
                status: 'aguardando_autorizacao'
            };

        } catch (error) {
            console.error('Erro ao criar senha:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== LOGIN ====================

    async realizarLogin(email, senha) {
        try {
            // Verificação especial para status
            if (senha === 'check-status-only') {
                return await this.verificarStatusAutorizacao(email);
            }

            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { 
                    sucesso: false, 
                    erro: 'Email ou senha incorretos' 
                };
            }

            // Verificar se tem senha
            if (!funcionario.password_hash) {
                return { 
                    sucesso: false, 
                    erro: 'Conta não finalizada. Complete o cadastro.',
                    action: 'completar_cadastro'
                };
            }

            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, funcionario.password_hash);
            if (!senhaValida) {
                return { 
                    sucesso: false, 
                    erro: 'Email ou senha incorretos' 
                };
            }

            // Verificar status da conta
            const statusInfo = this.verificarStatusConta(funcionario);
            if (!statusInfo.podeLogar) {
                return {
                    sucesso: false,
                    erro: statusInfo.mensagem,
                    status: statusInfo.status,
                    action: statusInfo.action
                };
            }

            // Login bem-sucedido - atualizar last_login
            const funcionarioIndex = funcionarios.findIndex(f => f.email === email);
            funcionario.last_login = new Date().toISOString();
            await this.atualizarLinhaPlanilha('Usuario', funcionarioIndex, funcionario);

            // Determinar dashboard correto
            const dashboardInfo = this.determinarDashboard(funcionario);

            return {
                sucesso: true,
                mensagem: 'Login realizado com sucesso!',
                usuario: {
                    user_id: funcionario.user_id,
                    email: funcionario.email,
                    nome: funcionario.full_name,
                    role: funcionario.role,
                    autorizado: funcionario.autorizado,
                    status: funcionario.status
                },
                dashboard: dashboardInfo,
                redirectTo: dashboardInfo.url
            };

        } catch (error) {
            console.error('Erro ao realizar login:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== VERIFICAÇÕES DE STATUS ====================

    verificarStatusConta(usuario) {
        switch (usuario.status) {
            case 'pendente_verificacao':
                return {
                    podeLogar: false,
                    status: 'email_nao_verificado',
                    mensagem: 'Verifique seu email para ativar a conta.',
                    action: 'verificar_email'
                };

            case 'email_verificado':
                return {
                    podeLogar: false,
                    status: 'senha_nao_criada',
                    mensagem: 'Complete o cadastro criando uma senha.',
                    action: 'criar_senha'
                };

            case 'aguardando_autorizacao':
                if (usuario.role === 'funcionario' && usuario.autorizado === 'nao') {
                    return {
                        podeLogar: false,
                        status: 'aguardando_autorizacao',
                        mensagem: 'Sua conta está aguardando autorização do administrador.',
                        action: 'aguardar'
                    };
                }
                break;

            case 'suspenso':
                return {
                    podeLogar: false,
                    status: 'conta_suspensa',
                    mensagem: 'Sua conta foi suspensa. Entre em contato com o administrador.',
                    action: 'contatar_admin'
                };

            case 'inativo':
                return {
                    podeLogar: false,
                    status: 'conta_inativa',
                    mensagem: 'Sua conta está inativa. Entre em contato com o administrador.',
                    action: 'contatar_admin'
                };
        }

        // Verificações específicas para funcionários
        if (usuario.role === 'funcionario' && usuario.autorizado === 'nao') {
            return {
                podeLogar: false,
                status: 'nao_autorizado',
                mensagem: 'Acesso não autorizado pelo administrador.',
                action: 'aguardar_autorizacao'
            };
        }

        return {
            podeLogar: true,
            status: 'ativo',
            mensagem: 'Conta ativa'
        };
    }

    // ==================== DETERMINAÇÃO DO DASHBOARD ====================

    determinarDashboard(usuario) {
        const dashboards = {
            admin: {
                url: '/dashboard.html',
                nome: 'Dashboard Administrativo',
                permissoes: ['total']
            },
            funcionario: {
                url: '/dashboard-funcionario.html',
                nome: 'Dashboard do Funcionário',
                permissoes: ['limitadas']
            },
            patient: {
                url: '/dashboard-paciente.html',
                nome: 'Portal do Paciente',
                permissoes: ['basicas']
            }
        };

        return dashboards[usuario.role] || dashboards.patient;
    }

    // ==================== AUTORIZAÇÃO DE FUNCIONÁRIOS ====================

    async autorizarFuncionario(adminEmail, funcionarioEmail, autorizado) {
        try {
            // Verificar se admin tem permissão
            const admins = await this.lerPlanilha('Usuario');
            const admin = admins.find(a => a.email === adminEmail && a.role === 'admin');
            
            if (!admin) {
                return { 
                    sucesso: false, 
                    erro: 'Apenas administradores podem autorizar funcionários' 
                };
            }

            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionarioIndex = funcionarios.findIndex(f => f.email === funcionarioEmail);
            
            if (funcionarioIndex === -1) {
                return { 
                    sucesso: false, 
                    erro: 'Funcionário não encontrado' 
                };
            }

            const funcionario = funcionarios[funcionarioIndex];
            
            // Atualizar autorização
            funcionario.autorizado = autorizado ? 'sim' : 'nao';
            funcionario.status = autorizado ? 'ativo' : 'nao_autorizado';
            funcionario.data_autorizacao = new Date().toISOString();
            funcionario.autorizado_por = adminEmail;

            await this.atualizarLinhaPlanilha('Usuario', funcionarioIndex, funcionario);

            // Enviar email de notificação
            await this.notificarFuncionarioAutorizacao(funcionario, autorizado);

            const mensagem = autorizado ? 'Funcionário autorizado com sucesso!' : 'Funcionário rejeitado';

            return { 
                sucesso: true, 
                mensagem,
                funcionario: {
                    email: funcionario.email,
                    nome: funcionario.full_name,
                    status: funcionario.status,
                    autorizado: funcionario.autorizado
                }
            };

        } catch (error) {
            console.error('Erro ao autorizar funcionário:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    // ==================== LISTAGEM E CONSULTAS ====================

    async listarSolicitacoes() {
        try {
            const funcionarios = await this.lerPlanilha('Usuario');
            
            // Filtrar e formatar dados para retorno
            const solicitacoes = funcionarios.map(funcionario => ({
                id: funcionario.user_id,
                nome: funcionario.full_name,
                email: funcionario.email,
                cpf: funcionario.cpf,
                telefone: funcionario.telefone,
                cargo: funcionario.cargo,
                tipo: funcionario.role,
                status: funcionario.status,
                autorizado: funcionario.autorizado,
                data_cadastro: funcionario.created_at,
                data_autorizacao: funcionario.data_autorizacao
            }));

            return { 
                sucesso: true, 
                solicitacoes: solicitacoes
            };

        } catch (error) {
            console.error('Erro ao listar solicitações:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
            };
        }
    }

    async verificarStatusAutorizacao(email) {
        try {
            const funcionarios = await this.lerPlanilha('Usuario');
            const funcionario = funcionarios.find(f => f.email === email);
            
            if (!funcionario) {
                return { 
                    sucesso: false, 
                    erro: 'Funcionário não encontrado' 
                };
            }

            return { 
                sucesso: funcionario.status === 'ativo' && funcionario.autorizado === 'sim',
                status: funcionario.status,
                usuario: {
                    nome: funcionario.full_name,
                    email: funcionario.email,
                    tipo: funcionario.role,
                    status: funcionario.status,
                    autorizado: funcionario.autorizado
                },
                redirectTo: funcionario.status === 'ativo' ? this.determinarDashboard(funcionario).url : null
            };

        } catch (error) {
            console.error('Erro ao verificar status:', error);
            return { 
                sucesso: false, 
                erro: 'Erro interno do sistema' 
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
            if (!this.emailService) {
                console.warn('Serviço de email não disponível');
                return { sucesso: false, erro: 'Serviço de email não configurado' };
            }
            
            const resultado = await this.emailService.enviarEmail(
                email,
                'Confirme sua conta - Portal Dr. Marcio',
                this.gerarTemplateConfirmacao(nome, codigo)
            );

            return resultado;

        } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error);
            return { 
                sucesso: false, 
                erro: 'Erro ao enviar email' 
            };
        }
    }

    async enviarEmailBoasVindas(email, nome) {
        try {
            if (!this.emailService) {
                return { sucesso: false, erro: 'Serviço de email não configurado' };
            }
            
            await this.emailService.enviarEmail(
                email,
                'Bem-vindo ao Portal Dr. Marcio!',
                this.gerarTemplateBoasVindas(nome, email)
            );

        } catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error);
        }
    }

    async notificarAdminNovoFuncionario(funcionario) {
        try {
            if (!this.emailService) return;
            
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@drmarcio.com.br';
            
            await this.emailService.enviarEmail(
                adminEmail,
                '[Portal Dr. Marcio] Nova solicitação de funcionário',
                this.gerarTemplateNotificacaoAdmin(funcionario)
            );

        } catch (error) {
            console.error('Erro ao notificar admin:', error);
        }
    }

    async notificarFuncionarioAutorizacao(funcionario, autorizado) {
        try {
            if (!this.emailService) return;
            
            const assunto = autorizado ? 
                'Conta Aprovada - Portal Dr. Marcio' : 
                'Atualização da Conta - Portal Dr. Marcio';
            
            await this.emailService.enviarEmail(
                funcionario.email,
                assunto,
                this.gerarTemplateAutorizacao(funcionario, autorizado)
            );

        } catch (error) {
            console.error('Erro ao notificar funcionário sobre autorização:', error);
        }
    }

    // ==================== TEMPLATES DE EMAIL ====================

    gerarTemplateConfirmacao(nome, codigo) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Portal Dr. Marcio</h1>
                <p style="margin: 10px 0 0; font-size: 16px;">Confirmação de Conta</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    Bem-vindo ao Portal Dr. Marcio! Para finalizar seu cadastro como funcionário, 
                    confirme seu email usando o código abaixo:
                </p>
                
                <div style="background: #f8f9fa; border: 2px dashed #007bff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px;">
                    <h3 style="color: #007bff; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Seu Código de Verificação</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                        ${codigo}
                    </div>
                    <p style="color: #6c757d; margin: 10px 0 0; font-size: 14px;">⏰ Válido por 5 minutos</p>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
                    <h4 style="color: #856404; margin: 0 0 10px;">⚠️ Importante:</h4>
                    <ul style="color: #856404; margin: 0; padding-left: 20px;">
                        <li>Este código expira em 5 minutos</li>
                        <li>Você tem até 3 tentativas para inserir o código</li>
                        <li>Não compartilhe este código com ninguém</li>
                    </ul>
                </div>
                
                <div style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px;">
                    <p><strong>Portal Dr. Marcio</strong></p>
                    <p>Se você não solicitou este cadastro, ignore este email.</p>
                </div>
            </div>
        </div>
        `;
    }

    gerarTemplateBoasVindas(nome, email) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Bem-vindo!</h1>
                <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
                
                <p style="color: #666; line-height: 1.6; font-size: 16px;">
                    Parabéns! Sua conta foi criada com sucesso no Portal Dr. Marcio.
                </p>
                
                <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #155724; margin: 0 0 15px;">✅ Próximos Passos:</h4>
                    <ol style="color: #155724; margin: 0; padding-left: 20px;">
                        <li>Aguarde a autorização do administrador</li>
                        <li>Você receberá um email quando for aprovado</li>
                        <li>Após aprovação, poderá fazer login no sistema</li>
                    </ol>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h4 style="color: #333; margin: 0 0 15px;">📋 Informações da Conta:</h4>
                    <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Tipo:</strong> Funcionário</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Status:</strong> Aguardando Autorização</p>
                </div>
                
                <div style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px;">
                    <p><strong>Portal Dr. Marcio</strong></p>
                    <p>Em caso de dúvidas, entre em contato conosco.</p>
                </div>
            </div>
        </div>
        `;
    }

    gerarTemplateNotificacaoAdmin(funcionario) {
        return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
                    <p style="margin: 5px 0; color: #666;"><strong>Nome:</strong> ${funcionario.full_name}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${funcionario.email}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>CPF:</strong> ${funcionario.cpf}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Cargo:</strong> ${funcionario.cargo}</p>
                    <p style="margin: 5px 0; color: #666;"><strong>Data do cadastro:</strong> ${new Date(funcionario.created_at).toLocaleString('pt-BR')}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.SITE_URL || 'http://localhost:3000'}/admin-autorizacoes.html" 
                       style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Gerenciar Autorizações
                    </a>
                </div>
            </div>
        </div>
        `;
    }

    gerarTemplateAutorizacao(funcionario, autorizado) {
        if (autorizado) {
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Conta Aprovada!</h1>
                    <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                    <h2 style="color: #333; margin-top: 0;">Parabéns, ${funcionario.full_name}!</h2>
                    
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
                        <a href="${process.env.SITE_URL || 'http://localhost:3000'}/login.html" 
                           style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Fazer Login
                        </a>
                    </div>
                </div>
            </div>
            `;
        } else {
            return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc3545; color: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">Atualização da Conta</h1>
                    <p style="margin: 10px 0 0; font-size: 16px;">Portal Dr. Marcio</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; border: 1px solid #e9ecef;">
                    <h2 style="color: #333; margin-top: 0;">Olá, ${funcionario.full_name}</h2>
                    <p style="color: #666; line-height: 1.6;">Sua solicitação de acesso foi rejeitada.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #666;">Para mais informações, entre em contato com o administrador.</p>
                    </div>
                </div>
            </div>
            `;
        }
    }
}

module.exports = AuthSystemComplete;