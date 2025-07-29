const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const app = express();

// Importar sistema LGPD
const lgpdRoutes = require('./src/routes/lgpd.routes');
const LGPDMiddleware = require('./src/middleware/lgpd.middleware');

// Importar sistema de pagamentos
const paymentRoutes = require('./src/routes/payments.routes');

// Middleware
app.use(cors());
app.use(express.json());
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

// Rotas LGPD
app.use('/api/lgpd', lgpdRoutes);

// Rotas de Pagamentos
app.use('/api/payments', paymentRoutes);

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

// Iniciar servidor
const PORT = process.env.PORT || 3000;

initSheet().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
});