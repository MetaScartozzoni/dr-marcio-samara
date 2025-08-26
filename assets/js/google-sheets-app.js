// 📊 Sistema Rápido com Google Sheets - Portal Dr. Marcio
// Configuração para usar planilha como banco de dados

// 🔧 CONFIGURAÇÃO DA PLANILHA GOOGLE SHEETS

/*
ESTRUTURA DA PLANILHA (4 abas):

1. ABA "pacientes":
   A | B | C | D | E | F | G | H
   id | nome | email | telefone | cpf | data_nascimento | endereco | data_cadastro

2. ABA "agendamentos":
   A | B | C | D | E | F | G | H
   id | paciente_id | data | hora | tipo_consulta | status | observacoes | data_criacao

3. ABA "orcamentos":
   A | B | C | D | E | F | G | H | I
   id | paciente_id | procedimento | valor | status | data_criacao | data_vencimento | descricao | desconto

4. ABA "dashboard":
   A | B | C
   metrica | valor | data_atualizacao
*/

class GoogleSheetsApp {
    constructor() {
        // 🔑 CONFIGURAÇÕES - SUBSTITUA PELOS SEUS DADOS
        this.spreadsheetId = 'SUA_PLANILHA_ID_AQUI'; // ID da sua planilha
        this.apiKey = 'SUA_API_KEY_AQUI'; // Chave da API Google
        
        this.baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}`;
        
        this.sheets = {
            pacientes: 'pacientes!A:H',
            agendamentos: 'agendamentos!A:H', 
            orcamentos: 'orcamentos!A:I',
            dashboard: 'dashboard!A:C'
        };
    }

    // 📋 CADASTRO DE PACIENTES
    async cadastrarPaciente(dados) {
        const row = [
            this.generateId(),
            dados.nome,
            dados.email,
            dados.telefone,
            dados.cpf,
            dados.dataNascimento,
            dados.endereco,
            new Date().toISOString()
        ];

        return await this.appendRow('pacientes', row);
    }

    async listarPacientes() {
        return await this.getSheetData('pacientes');
    }

    // 📅 AGENDAMENTOS
    async criarAgendamento(dados) {
        const row = [
            this.generateId(),
            dados.pacienteId,
            dados.data,
            dados.hora,
            dados.tipoConsulta,
            'Agendado',
            dados.observacoes || '',
            new Date().toISOString()
        ];

        return await this.appendRow('agendamentos', row);
    }

    async listarAgendamentos() {
        return await this.getSheetData('agendamentos');
    }

    // 💰 ORÇAMENTOS
    async criarOrcamento(dados) {
        const row = [
            this.generateId(),
            dados.pacienteId,
            dados.procedimento,
            dados.valor,
            'Pendente',
            new Date().toISOString(),
            dados.dataVencimento,
            dados.descricao || '',
            dados.desconto || 0
        ];

        return await this.appendRow('orcamentos', row);
    }

    async listarOrcamentos() {
        return await this.getSheetData('orcamentos');
    }

    // 📈 DASHBOARD
    async atualizarDashboard() {
        const pacientes = await this.listarPacientes();
        const agendamentos = await this.listarAgendamentos();
        const orcamentos = await this.listarOrcamentos();

        const metricas = [
            ['Total Pacientes', pacientes.length - 1, new Date().toISOString()],
            ['Agendamentos Hoje', this.contarAgendamentosHoje(agendamentos), new Date().toISOString()],
            ['Orçamentos Pendentes', this.contarOrcamentosPendentes(orcamentos), new Date().toISOString()],
            ['Receita Estimada', this.calcularReceitaEstimada(orcamentos), new Date().toISOString()]
        ];

        return await this.updateRange('dashboard!A:C', metricas);
    }

    // 🔧 MÉTODOS AUXILIARES
    async getSheetData(sheetName) {
        try {
            const response = await fetch(
                `${this.baseUrl}/values/${this.sheets[sheetName]}?key=${this.apiKey}`
            );
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            return [];
        }
    }

    async appendRow(sheetName, row) {
        try {
            const response = await fetch(
                `${this.baseUrl}/values/${this.sheets[sheetName]}:append?valueInputOption=RAW&key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: [row]
                    })
                }
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao adicionar linha:', error);
            return null;
        }
    }

    async updateRange(range, values) {
        try {
            const response = await fetch(
                `${this.baseUrl}/values/${range}?valueInputOption=RAW&key=${this.apiKey}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: values
                    })
                }
            );
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar range:', error);
            return null;
        }
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 5);
    }

    contarAgendamentosHoje(agendamentos) {
        const hoje = new Date().toISOString().split('T')[0];
        return agendamentos.filter(ag => ag[2] === hoje).length;
    }

    contarOrcamentosPendentes(orcamentos) {
        return orcamentos.filter(orc => orc[4] === 'Pendente').length;
    }

    calcularReceitaEstimada(orcamentos) {
        return orcamentos
            .filter(orc => orc[4] === 'Aprovado')
            .reduce((total, orc) => total + parseFloat(orc[3] || 0), 0);
    }
}

// 🚀 INICIALIZAÇÃO
const app = new GoogleSheetsApp();

// 📋 FORMULÁRIOS AUTOMÁTICOS
window.cadastrarPaciente = async function() {
    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        cpf: document.getElementById('cpf').value,
        dataNascimento: document.getElementById('dataNascimento').value,
        endereco: document.getElementById('endereco').value
    };

    const resultado = await app.cadastrarPaciente(dados);
    if (resultado) {
        alert('Paciente cadastrado com sucesso!');
        document.getElementById('formPaciente').reset();
        carregarPacientes();
    }
};

window.criarAgendamento = async function() {
    const dados = {
        pacienteId: document.getElementById('pacienteSelect').value,
        data: document.getElementById('dataAgendamento').value,
        hora: document.getElementById('horaAgendamento').value,
        tipoConsulta: document.getElementById('tipoConsulta').value,
        observacoes: document.getElementById('observacoes').value
    };

    const resultado = await app.criarAgendamento(dados);
    if (resultado) {
        alert('Agendamento criado com sucesso!');
        document.getElementById('formAgendamento').reset();
        carregarAgendamentos();
    }
};

window.criarOrcamento = async function() {
    const dados = {
        pacienteId: document.getElementById('pacienteOrcamento').value,
        procedimento: document.getElementById('procedimento').value,
        valor: document.getElementById('valor').value,
        dataVencimento: document.getElementById('dataVencimento').value,
        descricao: document.getElementById('descricaoOrcamento').value,
        desconto: document.getElementById('desconto').value
    };

    const resultado = await app.criarOrcamento(dados);
    if (resultado) {
        alert('Orçamento criado com sucesso!');
        document.getElementById('formOrcamento').reset();
        carregarOrcamentos();
    }
};

// 📊 CARREGAMENTO DE DADOS
window.carregarPacientes = async function() {
    const pacientes = await app.listarPacientes();
    const tbody = document.getElementById('listaPacientes');
    const select = document.getElementById('pacienteSelect');
    
    if (tbody) {
        tbody.innerHTML = '';
        pacientes.slice(1).forEach(paciente => {
            const row = tbody.insertRow();
            paciente.forEach(dado => {
                const cell = row.insertCell();
                cell.textContent = dado;
            });
        });
    }

    if (select) {
        select.innerHTML = '<option value="">Selecione um paciente</option>';
        pacientes.slice(1).forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente[0];
            option.textContent = paciente[1];
            select.appendChild(option);
        });
    }
};

window.carregarAgendamentos = async function() {
    const agendamentos = await app.listarAgendamentos();
    const tbody = document.getElementById('listaAgendamentos');
    
    if (tbody) {
        tbody.innerHTML = '';
        agendamentos.slice(1).forEach(agendamento => {
            const row = tbody.insertRow();
            agendamento.forEach(dado => {
                const cell = row.insertCell();
                cell.textContent = dado;
            });
        });
    }
};

window.carregarOrcamentos = async function() {
    const orcamentos = await app.listarOrcamentos();
    const tbody = document.getElementById('listaOrcamentos');
    
    if (tbody) {
        tbody.innerHTML = '';
        orcamentos.slice(1).forEach(orcamento => {
            const row = tbody.insertRow();
            orcamento.forEach(dado => {
                const cell = row.insertCell();
                cell.textContent = dado;
            });
        });
    }
};

window.carregarDashboard = async function() {
    await app.atualizarDashboard();
    const metricas = await app.getSheetData('dashboard');
    
    metricas.forEach(metrica => {
        const elemento = document.getElementById(metrica[0].replace(' ', ''));
        if (elemento) {
            elemento.textContent = metrica[1];
        }
    });
};

// 🔄 AUTO-CARREGAR AO INICIAR
document.addEventListener('DOMContentLoaded', function() {
    carregarPacientes();
    carregarAgendamentos();
    carregarOrcamentos();
    carregarDashboard();
});

// 📱 EXPORT GLOBAL
window.GoogleSheetsApp = app;
