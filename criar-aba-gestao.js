// Script para criar automaticamente a aba de gestão na planilha Google Sheets
// Este arquivo é executado pelo comando: npm run criar-aba

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1KSZcXweNg7csm-Xi0YYg8v-3mHg6cB5xI2NympkTY4k';

async function criarAbaGestao() {
    try {
        console.log('🔄 Conectando à planilha Google Sheets...');
        
        const creds = require('./credentials.json');
        
        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        // Verificar se a aba já existe
        let sheet = doc.sheetsByTitle['Gestao_Geral'];
        if (sheet) {
            console.log('Aba Gestao_Geral já existe');
            return;
        }
        
        // Criar nova aba
        sheet = await doc.addSheet({
            title: 'Gestao_Geral',
            headerValues: [
                'ID_Paciente',
                'Nome_Paciente',
                'Data_Criacao',
                'Data_Ultima_Update',
                'Agendamento_Data',
                'Agendamento_Hora',
                'Agendamento_Status',
                'Consulta_Status',
                'Consulta_Observacao',
                'Orcamento_Status',
                'Orcamento_Data',
                'Orcamento_Link_Editar',
                'Orcamento_PDF_Link',
                'Orcamento_Link_Aceite',
                'Orcamento_Status_Aceite',
                'Pagamento_Valor_Entrada',
                'Pagamento_Comprovante',
                'Pagamento_Observacao',
                'Status_Geral',
                'Ultima_Acao'
            ]
        });
        
        // Configurar formatação
        await sheet.loadCells('A1:T1');
        
        // Formatar cabeçalho
        for (let i = 0; i < 20; i++) {
            const cell = sheet.getCell(0, i);
            cell.backgroundColor = { red: 0.26, green: 0.52, blue: 0.96 };
            cell.textFormat = { 
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true 
            };
            cell.horizontalAlignment = 'CENTER';
        }
        
        await sheet.saveUpdatedCells();
        
        console.log('Aba Gestao_Geral criada com sucesso!');
        
        // Sincronizar dados existentes da aba Usuario
        await sincronizarDadosIniciais(doc, sheet);
        
    } catch (error) {
        console.error('Erro ao criar aba:', error);
    }
}

async function sincronizarDadosIniciais(doc, gestaoSheet) {
    try {
        const usuarioSheet = doc.sheetsByTitle['Usuario'];
        if (!usuarioSheet) {
            console.log('Aba Usuario não encontrada');
            return;
        }
        
        const rows = await usuarioSheet.getRows();
        const pacientes = rows.filter(row => row.role === 'patient');
        
        console.log(`Sincronizando ${pacientes.length} pacientes...`);
        
        for (let paciente of pacientes) {
            await gestaoSheet.addRow({
                ID_Paciente: paciente.user_id,
                Nome_Paciente: paciente.full_name,
                Data_Criacao: paciente.data_criacao || new Date().toISOString(),
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
                Ultima_Acao: 'Migrado automaticamente'
            });
        }
        
        console.log('Sincronização inicial concluída!');
    } catch (error) {
        console.error('Erro na sincronização inicial:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    criarAbaGestao();
}

module.exports = { criarAbaGestao };