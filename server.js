const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar configuração de banco
const { pool, testConnection, initializeDatabase } = require('./src/config/database');

// Importar sistema LGPD
const lgpdRoutes = require('./src/routes/lgpd.routes');
const LGPDMiddleware = require('./src/middleware/lgpd.middleware');

// Importar sistema de pagamentos
const paymentRoutes = require('./src/routes/payments.routes');

// Importar sistema de autenticação completo
const AuthSystemComplete = require('./auth-system-complete');

// Importar sistema de setup
const setupRoutes = require('./src/routes/setup.routes');
const { checkSystemSetup } = require('./src/middleware/setup.middleware');

// Importar novas rotas do banco de dados
const funcionariosRoutes = require('./src/routes/funcionarios.routes');
const jornadaRoutes = require('./src/routes/jornada.routes');
const systemRoutes = require('./src/routes/system.routes');

// Importar rotas da integração completa
const pacientesRoutes = require('./src/routes/pacientes.routes');
const { router: adminRoutes, initializeRoutes: initializeAdminRoutes } = require('./src/routes/admin.routes');

// Middleware básico
app.use(cors());
app.use(express.json());

// MIDDLEWARE DE SETUP - DEVE VIR ANTES DOS OUTROS
app.use(checkSystemSetup);

// Middleware estático após verificação de setup
app.use(express.static('.'));

// Middleware LGPD
app.use(LGPDMiddleware.privacyHeaders());
app.use(LGPDMiddleware.cookieConsent());
app.use(LGPDMiddleware.logAccess());
app.use(LGPDMiddleware.detectUnauthorizedAccess());
app.use(LGPDMiddleware.rateLimitByUser());

// Configuração da planilha
const SHEET_ID = '1KSZcXweNg7csm-Xi0YYg8v-3mHg6cB5xI2NympkTY4k';
let doc;
let authSystem; // Sistema de autenticação

// Inicializar conexão com Google Sheets
async function initSheet() {
    try {
        const creds = require('./credentials.json');
        
        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log('Conectado ao Google Sheets');
        
                // Inicializar sistema de autenticação
        const sendGridService = require('@sendgrid/mail');
        sendGridService.setApiKey(process.env.SENDGRID_API_KEY);
        
        // Configurar Google Sheets service para AuthSystem
        const googleSheetsService = {
            spreadsheets: {
                values: {
                    get: async (params) => {
                        const sheet = doc.sheetsByTitle[params.range.split('!')[0]] || doc.sheetsByIndex[0];
                        const rows = await sheet.getRows();
                        return {
                            data: {
                                values: rows.length > 0 ? [Object.keys(rows[0]._rawData), ...rows.map(row => Object.values(row._rawData))] : []
                            }
                        };
                    },
                    append: async (params) => {
                        const sheetName = params.range.split('!')[0];
                        const sheet = doc.sheetsByTitle[sheetName] || doc.sheetsByIndex[0];
                        await sheet.addRow(params.resource.values[0]);
                        return { success: true };
                    },
                    update: async (params) => {
                        const sheetName = params.range.split('!')[0];
                        const sheet = doc.sheetsByTitle[sheetName] || doc.sheetsByIndex[0];
                        const rows = await sheet.getRows();
                        const rowIndex = parseInt(params.range.match(/(\d+)/)[1]) - 2;
                        if (rows[rowIndex]) {
                            const headers = Object.keys(rows[0]._rawData);
                            headers.forEach((header, index) => {
                                rows[rowIndex][header] = params.resource.values[0][index] || '';
                            });
                            await rows[rowIndex].save();
                        }
                        return { success: true };
                    }
                }
            }
        };
        
        authSystem = new AuthSystemComplete(googleSheetsService, sendGridService);
        console.log('Sistema de autenticação inicializado');
        
    } catch (error) {
        console.error('Erro ao conectar com Google Sheets:', error);
    }
}

// Verificar se email existe na planilha
app.post('/api/verificar-email', async (req, res) => {
    try {
        const { email } = req.body;
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        const usuario = rows.find(row => row.email === email);
        
        if (usuario) {
            res.json({ 
                existe: true, 
                temSenha: !!usuario.password_hash,
                role: usuario.role 
            });
        } else {
            res.json({ existe: false });
        }
    } catch (error) {
        console.error('Erro ao verificar email:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Cadastrar novo usuário
app.post('/api/cadastrar', async (req, res) => {
    try {
        const { email, full_name, telefone, role } = req.body;
        const sheet = doc.sheetsByTitle['Usuario'];
        
        // Verificar se email já existe
        const rows = await sheet.getRows();
        const usuarioExiste = rows.find(row => row.email === email);
        
        if (usuarioExiste) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Gerar user_id único
        const user_id = 'USR_' + Date.now();
        
        // Definir role (padrão patient se não especificado)
        const userRole = role || 'patient';
        
        // Adicionar nova linha
        await sheet.addRow({
            email,
            full_name,
            telefone,
            role: userRole,
            user_id,
            status: 'ativo',
            autorizado: 'nao',
            last_login: '',
            password_hash: '',
            data_criacao: new Date().toISOString(),
            observacoes: 'Cadastro via webapp'
        });
        
        res.json({ sucesso: true, message: 'Usuário cadastrado com sucesso', role: userRole });
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Criar senha
app.post('/api/criar-senha', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        const usuario = rows.find(row => row.email === email);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Hash da senha
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(senha, saltRounds);
        
        // Atualizar senha na planilha
        usuario.password_hash = password_hash;
        await usuario.save();
        
        res.json({ sucesso: true, message: 'Senha criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar senha:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        console.log('Tentativa de login para:', email); // Debug
        
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        const usuario = rows.find(row => row.email === email);
        
        if (!usuario) {
            console.log('Usuário não encontrado:', email); // Debug
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        console.log('Usuário encontrado:', email, 'Role:', usuario.role); // Debug
        console.log('Tem senha hash?', !!usuario.password_hash); // Debug
        
        if (!usuario.password_hash) {
            console.log('Usuário precisa criar senha'); // Debug
            return res.json({ precisaCriarSenha: true });
        }
        
        // Verificar senha
        console.log('Verificando senha...'); // Debug
        const senhaValida = await bcrypt.compare(senha, usuario.password_hash);
        console.log('Senha válida?', senhaValida); // Debug
        
        if (!senhaValida) {
            console.log('Senha incorreta para:', email); // Debug
            return res.status(401).json({ erro: 'Senha incorreta' });
        }
        
        // Atualizar last_login
        usuario.last_login = new Date().toISOString();
        await usuario.save();
        
        console.log('Login bem-sucedido para:', email, 'Role:', usuario.role); // Debug
        
        res.json({ 
            sucesso: true, 
            role: usuario.role,
            full_name: usuario.full_name 
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar role de usuário existente
app.post('/api/atualizar-role', async (req, res) => {
    try {
        const { email, novoRole } = req.body;
        
        // Validar dados de entrada
        if (!email || !novoRole) {
            return res.status(400).json({ erro: 'Email e novo role são obrigatórios' });
        }
        
        // Validar roles permitidos
        const rolesPermitidos = ['patient', 'staff', 'admin'];
        if (!rolesPermitidos.includes(novoRole)) {
            return res.status(400).json({ erro: 'Role inválido. Use: patient, staff, admin' });
        }
        
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        // Encontrar usuário
        const usuario = rows.find(row => row.email === email);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Atualizar role
        const roleAnterior = usuario.role;
        usuario.role = novoRole;
        await usuario.save();
        
        console.log(`Role atualizado para ${email}: ${roleAnterior} -> ${novoRole}`);
        
        res.json({ 
            sucesso: true, 
            message: `Role atualizado de "${roleAnterior}" para "${novoRole}"`,
            email: email,
            roleAnterior: roleAnterior,
            novoRole: novoRole
        });
    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar autorização de usuário
app.post('/api/atualizar-autorizacao', async (req, res) => {
    try {
        const { email, autorizado } = req.body;
        
        // Validar dados de entrada
        if (!email || autorizado === undefined) {
            return res.status(400).json({ erro: 'Email e status de autorização são obrigatórios' });
        }
        
        // Validar valores permitidos
        const valoresPermitidos = ['sim', 'nao'];
        if (!valoresPermitidos.includes(autorizado)) {
            return res.status(400).json({ erro: 'Autorização deve ser "sim" ou "nao"' });
        }
        
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        // Encontrar usuário
        const usuario = rows.find(row => row.email === email);
        
        if (!usuario) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Atualizar autorização
        const autorizacaoAnterior = usuario.autorizado;
        usuario.autorizado = autorizado;
        await usuario.save();
        
        console.log(`Autorização atualizada para ${email}: ${autorizacaoAnterior} -> ${autorizado}`);
        
        res.json({ 
            sucesso: true, 
            message: `Autorização atualizada de "${autorizacaoAnterior}" para "${autorizado}"`,
            email: email,
            autorizacaoAnterior: autorizacaoAnterior,
            novaAutorizacao: autorizado
        });
    } catch (error) {
        console.error('Erro ao atualizar autorização:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Aprovar usuário pendente
app.post('/api/aprovar-usuario', async (req, res) => {
    try {
        const { userId, tipo } = req.body;
        
        // Validar dados de entrada
        if (!userId || !tipo) {
            return res.status(400).json({ success: false, message: 'UserId e tipo são obrigatórios' });
        }
        
        // Validar tipo (role)
        const tiposPermitidos = ['admin', 'funcionario', 'usuario'];
        if (!tiposPermitidos.includes(tipo)) {
            return res.status(400).json({ success: false, message: 'Tipo deve ser admin, funcionario ou usuario' });
        }
        
        const pendingSheet = doc.sheetsByTitle['Pending'];
        const usuarioSheet = doc.sheetsByTitle['Usuario'];
        
        // Buscar usuário na tabela Pending pelo userId
        const pendingRows = await pendingSheet.getRows();
        const usuarioPendente = pendingRows.find(row => row.userId === userId || row.email === userId);
        
        if (!usuarioPendente) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado na lista de pendentes' });
        }
        
        const email = usuarioPendente.email;
        const nome = usuarioPendente.nome;
        
        // Verificar se já existe na tabela Usuario
        const usuarioRows = await usuarioSheet.getRows();
        const usuarioExistente = usuarioRows.find(row => row.email === email);
        
        if (usuarioExistente) {
            // Se já existe, apenas atualizar
            usuarioExistente.nome = nome;
            usuarioExistente.role = tipo;
            usuarioExistente.autorizado = 'sim';
            usuarioExistente.status = 'ativo';
            await usuarioExistente.save();
        } else {
            // Criar novo usuário na tabela Usuario
            await usuarioSheet.addRow({
                email: email,
                nome: nome,
                role: tipo,
                autorizado: 'sim',
                status: 'ativo',
                senha: usuarioPendente.senha || '', // Manter senha se existir
                dataRegistro: usuarioPendente.dataRegistro || new Date().toISOString()
            });
        }
        
        // Remover da tabela Pending
        await usuarioPendente.delete();
        
        console.log(`Usuário aprovado e movido: ${email} -> Role: ${tipo}`);
        
        res.json({ 
            success: true, 
            message: `Usuário ${nome} aprovado com sucesso como ${tipo}`,
            email: email,
            nome: nome,
            tipo: tipo
        });
        
    } catch (error) {
        console.error('Erro ao aprovar usuário:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor', 
            detalhes: error.message 
        });
    }
});

// Listar usuários pendentes
app.get('/api/usuarios-pendentes', async (req, res) => {
    try {
        const pendingSheet = doc.sheetsByTitle['Pending'];
        const rows = await pendingSheet.getRows();
        
        const usuariosPendentes = rows.map((row, index) => ({
            id: row.email || index, // Usar email como ID único
            nome: row.nome || '',
            email: row.email || '',
            telefone: row.telefone || '',
            tipo: row.role || 'usuario',
            status: 'pending',
            autorizado: 'nao',
            created_at: row.dataRegistro || new Date().toISOString()
        }));
        
        res.json({
            success: true,
            usuarios: usuariosPendentes
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuários pendentes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            usuarios: []
        });
    }
});

// Listar usuários cadastrados
app.get('/api/listar-usuarios', async (req, res) => {
    try {
        const usuarioSheet = doc.sheetsByTitle['Usuario'];
        const rows = await usuarioSheet.getRows();
        
        const usuarios = rows.map(row => ({
            email: row.email || '',
            nome: row.nome || '',
            role: row.role || 'usuario',
            autorizado: row.autorizado || 'nao',
            status: row.status || 'ativo',
            dataRegistro: row.dataRegistro || ''
        }));
        
        res.json({
            sucesso: true,
            total: usuarios.length,
            usuarios: usuarios
        });
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ 
            sucesso: false, 
            message: 'Erro interno do servidor',
            total: 0,
            usuarios: []
        });
    }
});

// Servir páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'cadastro.html'));
});

app.get('/senha', (req, res) => {
    res.sendFile(path.join(__dirname, 'senha.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Obter todos os dados da gestão
app.get('/api/gestao/dados', async (req, res) => {
    try {
        const sheet = doc.sheetsByTitle['Gestao_Geral'];
        if (!sheet) {
            return res.status(404).json({ erro: 'Aba Gestao_Geral não encontrada' });
        }
        
        const rows = await sheet.getRows();
        const dados = rows.map(row => ({
            id_paciente: row.ID_Paciente || '',
            nome_paciente: row.Nome_Paciente || '',
            data_criacao: row.Data_Criacao || '',
            data_ultima_update: row.Data_Ultima_Update || '',
            agendamento_data: row.Agendamento_Data || '',
            agendamento_hora: row.Agendamento_Hora || '',
            agendamento_status: row.Agendamento_Status || 'Pendente',
            consulta_status: row.Consulta_Status || 'Não Realizada',
            consulta_observacao: row.Consulta_Observacao || '',
            orcamento_status: row.Orcamento_Status || 'Não Enviado',
            orcamento_data: row.Orcamento_Data || '',
            orcamento_link_editar: row.Orcamento_Link_Editar || '',
            orcamento_pdf_link: row.Orcamento_PDF_Link || '',
            orcamento_link_aceite: row.Orcamento_Link_Aceite || '',
            orcamento_status_aceite: row.Orcamento_Status_Aceite || 'Pendente',
            pagamento_valor_entrada: row.Pagamento_Valor_Entrada || '',
            pagamento_comprovante: row.Pagamento_Comprovante || '',
            pagamento_observacao: row.Pagamento_Observacao || '',
            status_geral: row.Status_Geral || 'Novo',
            ultima_acao: row.Ultima_Acao || ''
        }));
        
        res.json(dados);
    } catch (error) {
        console.error('Erro ao obter dados da gestão:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar dados da gestão
app.post('/api/gestao/atualizar', async (req, res) => {
    try {
        const dadosAtualizacao = req.body;
        const sheet = doc.sheetsByTitle['Gestao_Geral'];
        
        if (!sheet) {
            return res.status(404).json({ erro: 'Aba Gestao_Geral não encontrada' });
        }
        
        const rows = await sheet.getRows();
        let pacienteEncontrado = false;
        
        // Procurar paciente existente
        for (let row of rows) {
            if (row.ID_Paciente === dadosAtualizacao.id_paciente) {
                // Atualizar dados existentes
                row.Nome_Paciente = dadosAtualizacao.nome_paciente;
                row.Data_Ultima_Update = new Date().toISOString();
                row.Agendamento_Data = dadosAtualizacao.agendamento_data;
                row.Agendamento_Hora = dadosAtualizacao.agendamento_hora;
                row.Agendamento_Status = dadosAtualizacao.agendamento_status;
                row.Consulta_Status = dadosAtualizacao.consulta_status;
                row.Consulta_Observacao = dadosAtualizacao.consulta_observacao || '';
                row.Orcamento_Status = dadosAtualizacao.orcamento_status;
                row.Orcamento_Data = dadosAtualizacao.orcamento_data || new Date().toISOString();
                row.Orcamento_Link_Editar = dadosAtualizacao.orcamento_link_editar || '';
                row.Orcamento_PDF_Link = dadosAtualizacao.orcamento_pdf_link || '';
                row.Orcamento_Link_Aceite = dadosAtualizacao.orcamento_link_aceite || '';
                row.Orcamento_Status_Aceite = dadosAtualizacao.orcamento_status_aceite;
                row.Pagamento_Valor_Entrada = dadosAtualizacao.pagamento_valor_entrada || '';
                row.Pagamento_Comprovante = dadosAtualizacao.pagamento_comprovante || '';
                row.Pagamento_Observacao = dadosAtualizacao.pagamento_observacao || '';
                row.Status_Geral = dadosAtualizacao.status_geral;
                row.Ultima_Acao = `Atualizado em ${new Date().toLocaleString('pt-BR')}`;
                
                await row.save();
                pacienteEncontrado = true;
                break;
            }
        }
        
        // Se não encontrou, criar novo registro
        if (!pacienteEncontrado) {
            await sheet.addRow({
                ID_Paciente: dadosAtualizacao.id_paciente,
                Nome_Paciente: dadosAtualizacao.nome_paciente,
                Data_Criacao: new Date().toISOString(),
                Data_Ultima_Update: new Date().toISOString(),
                Agendamento_Data: dadosAtualizacao.agendamento_data || '',
                Agendamento_Hora: dadosAtualizacao.agendamento_hora || '',
                Agendamento_Status: dadosAtualizacao.agendamento_status || 'Pendente',
                Consulta_Status: dadosAtualizacao.consulta_status || 'Não Realizada',
                Consulta_Observacao: dadosAtualizacao.consulta_observacao || '',
                Orcamento_Status: dadosAtualizacao.orcamento_status || 'Não Enviado',
                Orcamento_Data: dadosAtualizacao.orcamento_data || '',
                Orcamento_Link_Editar: dadosAtualizacao.orcamento_link_editar || '',
                Orcamento_PDF_Link: dadosAtualizacao.orcamento_pdf_link || '',
                Orcamento_Link_Aceite: dadosAtualizacao.orcamento_link_aceite || '',
                Orcamento_Status_Aceite: dadosAtualizacao.orcamento_status_aceite || 'Pendente',
                Pagamento_Valor_Entrada: dadosAtualizacao.pagamento_valor_entrada || '',
                Pagamento_Comprovante: dadosAtualizacao.pagamento_comprovante || '',
                Pagamento_Observacao: dadosAtualizacao.pagamento_observacao || '',
                Status_Geral: dadosAtualizacao.status_geral || 'Novo',
                Ultima_Acao: `Criado em ${new Date().toLocaleString('pt-BR')}`
            });
        }
        
        res.json({ sucesso: true, message: 'Dados atualizados com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar gestão:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Sincronizar dados da aba Usuario com Gestao_Geral
app.post('/api/gestao/sincronizar', async (req, res) => {
    try {
        const usuarioSheet = doc.sheetsByTitle['Usuario'];
        const gestaoSheet = doc.sheetsByTitle['Gestao_Geral'];
        
        if (!usuarioSheet || !gestaoSheet) {
            return res.status(404).json({ erro: 'Abas não encontradas' });
        }
        
        const usuarioRows = await usuarioSheet.getRows();
        const gestaoRows = await gestaoSheet.getRows();
        
        // Criar mapa dos IDs existentes na gestão
        const idsExistentes = new Set(gestaoRows.map(row => row.ID_Paciente));
        
        let novosRegistros = 0;
        
        for (let usuarioRow of usuarioRows) {
            if (usuarioRow.role === 'patient' && !idsExistentes.has(usuarioRow.user_id)) {
                // Adicionar novo paciente na gestão
                await gestaoSheet.addRow({
                    ID_Paciente: usuarioRow.user_id,
                    Nome_Paciente: usuarioRow.full_name,
                    Data_Criacao: usuarioRow.data_criacao || new Date().toISOString(),
                    Data_Ultima_Update: new Date().toISOString(),
                    Agendamento_Data: '',
                    Agendamento_Hora: '',
                    Agendamento_Status: 'Pendente',
                    Consulta_Status: 'Não Realizada',
                    Consulta_Observacao: '',
                    Orcamento_Status: 'Não Enviado',
                    Orcamento_Data: '',
                    Orcamento_Link_Editar: '',
                    Orcamento_PDF_Link: '',
                    Orcamento_Link_Aceite: '',
                    Orcamento_Status_Aceite: 'Pendente',
                    Pagamento_Valor_Entrada: '',
                    Pagamento_Comprovante: '',
                    Pagamento_Observacao: '',
                    Status_Geral: 'Novo',
                    Ultima_Acao: 'Sincronizado automaticamente'
                });
                novosRegistros++;
            }
        }
        
        res.json({ 
            sucesso: true, 
            message: `Sincronização concluída. ${novosRegistros} novos registros adicionados.` 
        });
    } catch (error) {
        console.error('Erro ao sincronizar:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Obter estatísticas do dashboard
app.get('/api/gestao/estatisticas', async (req, res) => {
    try {
        const sheet = doc.sheetsByTitle['Gestao_Geral'];
        if (!sheet) {
            return res.status(404).json({ erro: 'Aba Gestao_Geral não encontrada' });
        }
        
        const rows = await sheet.getRows();
        const hoje = new Date().toISOString().split('T')[0];
        
        const estatisticas = {
            totalPacientes: rows.length,
            agendamentosHoje: 0,
            orcamentosPendentes: 0,
            pagamentosPendentes: 0,
            statusDistribuicao: {},
            agendamentosProximosDias: 0
        };
        
        const proximosDias = new Date();
        proximosDias.setDate(proximosDias.getDate() + 7);
        const proximosDiasStr = proximosDias.toISOString().split('T')[0];
        
        rows.forEach(row => {
            // Agendamentos hoje
            if (row.Agendamento_Data && row.Agendamento_Data.includes(hoje)) {
                estatisticas.agendamentosHoje++;
            }
            
            // Agendamentos próximos 7 dias
            if (row.Agendamento_Data && row.Agendamento_Data <= proximosDiasStr && row.Agendamento_Data >= hoje) {
                estatisticas.agendamentosProximosDias++;
            }
            
            // Orçamentos pendentes
            if (row.Orcamento_Status === 'Enviado') {
                estatisticas.orcamentosPendentes++;
            }
            
            // Pagamentos pendentes
            if (row.Status_Geral === 'Aguardando Pagamento') {
                estatisticas.pagamentosPendentes++;
            }
            
            // Distribuição de status
            const status = row.Status_Geral || 'Indefinido';
            estatisticas.statusDistribuicao[status] = (estatisticas.statusDistribuicao[status] || 0) + 1;
        });
        
        res.json(estatisticas);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Servir página de gestão
app.get('/gestao', (req, res) => {
    res.sendFile(path.join(__dirname, 'gestao.html'));
});

// Rotas de Setup (DEVE VIR PRIMEIRO)
app.use('/setup', setupRoutes);
app.use('/api/setup', setupRoutes);

// Rotas LGPD
app.use('/api/lgpd', lgpdRoutes);

// Rotas de Pagamentos
app.use('/api/payments', paymentRoutes);

// Novas rotas do banco de dados
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/jornada', jornadaRoutes);
app.use('/api/system', systemRoutes);

// Rotas da integração completa de pacientes
app.use('/api/pacientes', pacientesRoutes);

// Rotas administrativas para logs
initializeAdminRoutes(pool);
app.use('/api/admin', adminRoutes);

// ENDPOINTS ANTIGOS (Google Sheets) - Manter durante migração
const configRoutes = require('./src/routes/config.routes');
app.use('/api/config', configRoutes);

// ==================== ROTAS DE AUTENTICAÇÃO COMPLETA ====================

// Cadastro de funcionário
app.post('/api/auth/cadastrar-funcionario', async (req, res) => {
    try {
        const resultado = await authSystem.cadastrarFuncionario(req.body);
        res.json(resultado);
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Verificar código de email
app.post('/api/auth/verificar-codigo', async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const resultado = await authSystem.verificarCodigo(email, codigo);
        res.json(resultado);
    } catch (error) {
        console.error('Erro na verificação:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Reenviar código
app.post('/api/auth/reenviar-codigo', async (req, res) => {
    try {
        const { email } = req.body;
        const resultado = await authSystem.reenviarCodigo(email);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Criar senha
app.post('/api/auth/criar-senha', async (req, res) => {
    try {
        const { email, senha, confirmarSenha } = req.body;
        const resultado = await authSystem.criarSenha(email, senha, confirmarSenha);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao criar senha:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Login completo
app.post('/api/auth/login-completo', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const resultado = await authSystem.realizarLogin(email, senha);
        res.json(resultado);
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Autorizar funcionário (apenas admin)
app.post('/api/auth/autorizar-funcionario', async (req, res) => {
    try {
        const { email, acao } = req.body;
        // TODO: Adicionar verificação de admin aqui
        const resultado = await authSystem.autorizarFuncionario(email, acao);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao autorizar funcionário:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Listar solicitações (apenas admin)
app.get('/api/auth/listar-solicitacoes', async (req, res) => {
    try {
        // TODO: Adicionar verificação de admin aqui
        const resultado = await authSystem.listarSolicitacoes();
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao listar solicitações:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Verificar status de autorização
app.post('/api/auth/verificar-status', async (req, res) => {
    try {
        const { email } = req.body;
        const resultado = await authSystem.verificarStatusAutorizacao(email);
        res.json(resultado);
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// Health Check para Railway
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            server: '✅ Online',
            sendgrid: process.env.SENDGRID_API_KEY ? '✅ Configurado' : '❌ Não configurado',
            twilio: process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Não configurado',
            database: process.env.DATABASE_URL ? '✅ Conectado' : '❌ Não conectado'
        },
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Endpoint de teste de email
app.get('/api/email/test', async (req, res) => {
    try {
        const EmailService = require('./src/services/email-sendgrid.service');
        const emailService = new EmailService();
        
        const testEmail = req.query.email || 'test@example.com';
        
        const resultado = await emailService.enviarEmail(
            testEmail,
            'Teste Railway - Portal Dr. Marcio',
            '<h1>🚀 Sistema Online!</h1><p>O Portal Dr. Marcio está funcionando perfeitamente no Railway!</p>'
        );
        
        res.json({
            success: resultado.sucesso,
            message: resultado.sucesso ? 'Email enviado com sucesso!' : 'Erro ao enviar email',
            details: resultado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de email',
            error: error.message
        });
    }
});

// Endpoint de teste de email via POST
app.post('/api/enviar-email', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        
        if (!to || !subject || !html) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: to, subject, html'
            });
        }
        
        const EmailService = require('./src/services/email-sendgrid.service');
        const emailService = new EmailService();
        
        const resultado = await emailService.enviarEmail(to, subject, html);
        
        res.json({
            success: resultado.sucesso,
            message: resultado.sucesso ? 'Email enviado com sucesso!' : 'Erro ao enviar email',
            details: resultado
        });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de email',
            error: error.message
        });
    }
});

// Endpoint de teste de SMS via POST
app.post('/api/enviar-sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: to, message'
            });
        }
        
        // Verificar se o Twilio está configurado
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            return res.status(400).json({
                success: false,
                message: 'Serviço SMS não configurado. Faltam variáveis do Twilio.',
                details: {
                    account_sid: process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'Não configurado',
                    auth_token: process.env.TWILIO_AUTH_TOKEN ? 'Configurado' : 'Não configurado',
                    phone_number: process.env.TWILIO_PHONE_NUMBER ? 'Configurado' : 'Não configurado'
                }
            });
        }
        
        // Importar Twilio dinamicamente
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const resultado = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        
        res.json({
            success: true,
            message: 'SMS enviado com sucesso!',
            details: {
                sid: resultado.sid,
                status: resultado.status,
                to: to
            }
        });
        
    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no serviço de SMS',
            error: error.message
        });
    }
});

// Endpoint para informações de configuração (sem expor dados sensíveis)
app.get('/api/config-info', (req, res) => {
    try {
        const configInfo = {
            email: {
                status: process.env.SENDGRID_API_KEY ? 'configured' : 'missing',
                variables: [
                    { name: 'SENDGRID_API_KEY', configured: !!process.env.SENDGRID_API_KEY },
                    { name: 'FROM_EMAIL', configured: !!process.env.FROM_EMAIL }
                ],
                service: 'SendGrid',
                docs: 'https://sendgrid.com/docs/api-reference/'
            },
            sms: {
                status: (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) ? 'configured' : 'missing',
                variables: [
                    { name: 'TWILIO_ACCOUNT_SID', configured: !!process.env.TWILIO_ACCOUNT_SID },
                    { name: 'TWILIO_AUTH_TOKEN', configured: !!process.env.TWILIO_AUTH_TOKEN },
                    { name: 'TWILIO_PHONE_NUMBER', configured: !!process.env.TWILIO_PHONE_NUMBER }
                ],
                service: 'Twilio',
                docs: 'https://www.twilio.com/docs/usage/api'
            },
            payments: {
                status: 'not-configured',
                variables: [
                    { name: 'STRIPE_SECRET_KEY', configured: !!process.env.STRIPE_SECRET_KEY },
                    { name: 'STRIPE_PUBLISHABLE_KEY', configured: !!process.env.STRIPE_PUBLISHABLE_KEY }
                ],
                service: 'Stripe',
                docs: 'https://stripe.com/docs/api'
            },
            whatsapp: {
                status: 'not-configured',
                variables: [
                    { name: 'WHATSAPP_TOKEN', configured: !!process.env.WHATSAPP_TOKEN },
                    { name: 'WHATSAPP_PHONE_ID', configured: !!process.env.WHATSAPP_PHONE_ID }
                ],
                service: 'WhatsApp Business API',
                docs: 'https://developers.facebook.com/docs/whatsapp'
            }
        };
        
        res.json({
            success: true,
            config: configInfo,
            railway_url: 'https://railway.app/project/portal-dr-marcio/variables'
        });
    } catch (error) {
        console.error('Erro ao buscar informações de configuração:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar configurações'
        });
    }
});

// ================================
// NOVAS ROTAS DE AUTENTICAÇÃO COMPLETA
// ================================

// 1. CADASTRO DE FUNCIONÁRIO COM EMAIL DE CONFIRMAÇÃO
app.post('/api/auth/cadastrar-funcionario', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const resultado = await authSystem.cadastrarFuncionario(req.body);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Erro na rota de cadastro:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 2. VERIFICAÇÃO DE CÓDIGO DE EMAIL
app.post('/api/auth/verificar-codigo', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const { email, codigo } = req.body;
        
        if (!email || !codigo) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Email e código são obrigatórios' 
            });
        }

        const resultado = await authSystem.verificarCodigo(email, codigo);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Erro na verificação de código:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 3. CRIAÇÃO DE SENHA APÓS VERIFICAÇÃO
app.post('/api/auth/criar-senha', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const { email, senha, confirmarSenha } = req.body;
        
        if (!email || !senha || !confirmarSenha) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Todos os campos são obrigatórios' 
            });
        }

        const resultado = await authSystem.criarSenha(email, senha, confirmarSenha);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Erro na criação de senha:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 4. LOGIN COMPLETO COM VERIFICAÇÕES
app.post('/api/auth/login-completo', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Email e senha são obrigatórios' 
            });
        }

        const resultado = await authSystem.realizarLogin(email, senha);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(401).json(resultado);
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 5. AUTORIZAÇÃO DE FUNCIONÁRIO (ADMIN)
app.post('/api/auth/autorizar-funcionario', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const { adminEmail, funcionarioEmail, autorizado } = req.body;
        
        if (!adminEmail || !funcionarioEmail || autorizado === undefined) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Todos os campos são obrigatórios' 
            });
        }

        const resultado = await authSystem.autorizarFuncionario(adminEmail, funcionarioEmail, autorizado);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(403).json(resultado);
        }
    } catch (error) {
        console.error('Erro na autorização:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 6. REENVIO DE CÓDIGO
app.post('/api/auth/reenviar-codigo', async (req, res) => {
    try {
        if (!authSystem) {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Sistema de autenticação não inicializado' 
            });
        }

        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'Email é obrigatório' 
            });
        }

        const resultado = await authSystem.reenviarCodigo(email);
        
        if (resultado.sucesso) {
            res.status(200).json(resultado);
        } else {
            res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Erro no reenvio de código:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 7. LISTAR FUNCIONÁRIOS PENDENTES (ADMIN)
app.get('/api/auth/funcionarios-pendentes', async (req, res) => {
    try {
        const sheet = doc.sheetsByTitle['Usuario'];
        const rows = await sheet.getRows();
        
        const funcionariosPendentes = rows
            .filter(row => 
                row.role === 'funcionario' && 
                (row.autorizado === 'nao' || row.status === 'ativo_pendente_autorizacao')
            )
            .map(row => ({
                user_id: row.user_id,
                email: row.email,
                nome: row.full_name,
                telefone: row.telefone,
                status: row.status,
                autorizado: row.autorizado,
                created_at: row.created_at,
                verified_at: row.verified_at
            }));

        res.json({
            sucesso: true,
            funcionarios: funcionariosPendentes,
            total: funcionariosPendentes.length
        });

    } catch (error) {
        console.error('Erro ao listar funcionários pendentes:', error);
        res.status(500).json({ 
            sucesso: false, 
            erro: 'Erro interno do servidor' 
        });
    }
});

// 8. STATUS DO SISTEMA DE AUTENTICAÇÃO
app.get('/api/auth/status', (req, res) => {
    res.json({
        sistema: 'Portal Dr. Marcio - Autenticação',
        versao: '2.0',
        status: authSystem ? 'Operacional' : 'Não Inicializado',
        recursos: [
            'Cadastro com verificação por email',
            'Códigos de confirmação',
            'Autorização de funcionários',
            'Login com verificações completas',
            'Redirecionamento inteligente',
            'Notificações por email'
        ],
        endpoints: [
            'POST /api/auth/cadastrar-funcionario',
            'POST /api/auth/verificar-codigo',
            'POST /api/auth/criar-senha',
            'POST /api/auth/login-completo',
            'POST /api/auth/autorizar-funcionario',
            'POST /api/auth/reenviar-codigo',
            'GET /api/auth/funcionarios-pendentes'
        ]
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Função de inicialização assíncrona
async function startServer() {
    try {
        console.log('🚀 Inicializando servidor...');
        
        // 1. Testar conexão com banco
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Falha na conexão com banco de dados');
        }
        
        // 2. Inicializar estrutura do banco
        await initializeDatabase();
        
        // 3. Inicializar Google Sheets (se necessário)
        await initSheet();
        
        // 4. Iniciar servidor
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🗄️ Banco de dados: Conectado`);
            console.log(`📊 Google Sheets: Configurado`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

// Iniciar aplicação
startServer();