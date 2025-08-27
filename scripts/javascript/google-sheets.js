// Google Sheets Integration - Portal Médico Dr. Marcio Scartozzoni
console.log('📊 Integração Google Sheets Carregada');

// Sistema de Integração com Google Sheets
window.GoogleSheetsAPI = {
    config: {
        apiKey: '',
        spreadsheetId: '',
        baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
        sheets: {
            agendamentos: 'Agendamentos',
            pacientes: 'Pacientes',
            fichas: 'Fichas',
            financeiro: 'Financeiro'
        }
    },

    // Inicializar configuração
    init: function() {
        console.log('🚀 Inicializando Google Sheets API');
        this.carregarConfiguracao();
    },

    // Carregar configuração do .env
    carregarConfiguracao: function() {
        // Em produção, essas variáveis viriam do servidor
        // Por enquanto, vamos usar um objeto de configuração
        this.config.apiKey = window.ENV?.GOOGLE_SHEETS_API_KEY || '';
        this.config.spreadsheetId = window.ENV?.GOOGLE_SPREADSHEET_ID || '';
        
        if (!this.config.apiKey || !this.config.spreadsheetId) {
            console.warn('⚠️ Configuração do Google Sheets não encontrada');
            return false;
        }
        
        console.log('✅ Google Sheets configurado');
        return true;
    },

    // Ler dados de uma aba
    lerAba: async function(nomeAba, intervalo = '') {
        if (!this.carregarConfiguracao()) {
            throw new Error('Configuração do Google Sheets não encontrada');
        }

        const range = intervalo ? `${nomeAba}!${intervalo}` : nomeAba;
        const url = `${this.config.baseUrl}/${this.config.spreadsheetId}/values/${range}?key=${this.config.apiKey}`;

        try {
            console.log(`📖 Lendo aba: ${nomeAba}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Dados carregados da aba ${nomeAba}:`, data.values?.length || 0, 'linhas');
            
            return this.processarDados(data.values || []);
        } catch (error) {
            console.error(`❌ Erro ao ler aba ${nomeAba}:`, error);
            throw error;
        }
    },

    // Processar dados da planilha (converter em objetos)
    processarDados: function(valores) {
        if (!valores || valores.length === 0) {
            return [];
        }

        const cabecalho = valores[0];
        const dados = valores.slice(1);

        return dados.map(linha => {
            const objeto = {};
            cabecalho.forEach((coluna, index) => {
                objeto[coluna.toLowerCase().replace(/\s+/g, '_')] = linha[index] || '';
            });
            return objeto;
        });
    },

    // Escrever dados em uma aba
    escreverAba: async function(nomeAba, dados, intervalo = 'A1') {
        if (!this.carregarConfiguracao()) {
            throw new Error('Configuração do Google Sheets não encontrada');
        }

        const range = `${nomeAba}!${intervalo}`;
        const url = `${this.config.baseUrl}/${this.config.spreadsheetId}/values/${range}?valueInputOption=RAW&key=${this.config.apiKey}`;

        const body = {
            values: Array.isArray(dados[0]) ? dados : [dados]
        };

        try {
            console.log(`✏️ Escrevendo na aba: ${nomeAba}`);
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Dados escritos na aba ${nomeAba}`);
            return result;
        } catch (error) {
            console.error(`❌ Erro ao escrever na aba ${nomeAba}:`, error);
            throw error;
        }
    },

    // Adicionar linha no final da aba
    adicionarLinha: async function(nomeAba, dados) {
        const range = `${nomeAba}!A:Z`;
        const url = `${this.config.baseUrl}/${this.config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${this.config.apiKey}`;

        const body = {
            values: [Array.isArray(dados) ? dados : Object.values(dados)]
        };

        try {
            console.log(`➕ Adicionando linha na aba: ${nomeAba}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Linha adicionada na aba ${nomeAba}`);
            return result;
        } catch (error) {
            console.error(`❌ Erro ao adicionar linha na aba ${nomeAba}:`, error);
            throw error;
        }
    },

    // Métodos específicos para cada tipo de dados
    agendamentos: {
        // Carregar todos os agendamentos
        carregar: async function() {
            return await GoogleSheetsAPI.lerAba(GoogleSheetsAPI.config.sheets.agendamentos);
        },

        // Adicionar novo agendamento
        adicionar: async function(agendamento) {
            const linha = [
                agendamento.id || '',
                agendamento.data || '',
                agendamento.hora || '',
                agendamento.paciente || '',
                agendamento.telefone || '',
                agendamento.tipo || '',
                agendamento.status || '',
                agendamento.procedimento || '',
                new Date().toISOString()
            ];
            
            return await GoogleSheetsAPI.adicionarLinha(GoogleSheetsAPI.config.sheets.agendamentos, linha);
        },

        // Sincronizar com localStorage
        sincronizar: async function() {
            try {
                const dadosSheet = await this.carregar();
                const dadosLocal = JSON.parse(localStorage.getItem('agendamentos_portal') || '[]');
                
                // Aqui você pode implementar a lógica de merge
                console.log('📊 Sincronizando agendamentos:', {
                    sheet: dadosSheet.length,
                    local: dadosLocal.length
                });
                
                return dadosSheet;
            } catch (error) {
                console.error('❌ Erro na sincronização:', error);
                return [];
            }
        }
    },

    pacientes: {
        carregar: async function() {
            return await GoogleSheetsAPI.lerAba(GoogleSheetsAPI.config.sheets.pacientes);
        },

        adicionar: async function(paciente) {
            const linha = [
                paciente.id || '',
                paciente.nome || '',
                paciente.telefone || '',
                paciente.email || '',
                paciente.nascimento || '',
                paciente.endereco || '',
                new Date().toISOString()
            ];
            
            return await GoogleSheetsAPI.adicionarLinha(GoogleSheetsAPI.config.sheets.pacientes, linha);
        }
    },

    fichas: {
        carregar: async function() {
            return await GoogleSheetsAPI.lerAba(GoogleSheetsAPI.config.sheets.fichas);
        },

        adicionar: async function(ficha) {
            const linha = [
                ficha.id || '',
                ficha.paciente_id || '',
                ficha.data || '',
                ficha.queixa_principal || '',
                ficha.exame_fisico || '',
                ficha.diagnostico || '',
                ficha.prescricao || '',
                ficha.observacoes || '',
                new Date().toISOString()
            ];
            
            return await GoogleSheetsAPI.adicionarLinha(GoogleSheetsAPI.config.sheets.fichas, linha);
        }
    }
};

// Funções de utilidade para integração
window.SheetsUtils = {
    // Testar conexão
    testarConexao: async function() {
        try {
            const info = await fetch(`${GoogleSheetsAPI.config.baseUrl}/${GoogleSheetsAPI.config.spreadsheetId}?key=${GoogleSheetsAPI.config.apiKey}`);
            
            if (info.ok) {
                const data = await info.json();
                console.log('✅ Conexão com Google Sheets OK:', data.properties.title);
                return { sucesso: true, titulo: data.properties.title };
            } else {
                throw new Error(`Erro ${info.status}: ${info.statusText}`);
            }
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            return { sucesso: false, erro: error.message };
        }
    },

    // Configurar credenciais
    configurar: function(apiKey, spreadsheetId) {
        window.ENV = window.ENV || {};
        window.ENV.GOOGLE_SHEETS_API_KEY = apiKey;
        window.ENV.GOOGLE_SPREADSHEET_ID = spreadsheetId;
        
        GoogleSheetsAPI.carregarConfiguracao();
        console.log('⚙️ Credenciais configuradas');
    }
};

console.log('✅ Google Sheets Integration carregado com sucesso!');
