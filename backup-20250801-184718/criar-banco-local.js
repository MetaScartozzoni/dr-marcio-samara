const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function criarBancoLocal() {
    return new Promise((resolve, reject) => {
        console.log('📊 Criando banco SQLite local para sistema de recuperação de senha...');
        
        const dbPath = path.join(__dirname, 'sistema-recuperacao.db');
        const db = new sqlite3.Database(dbPath);
        
        // Criar tabelas necessárias
        const tabelas = [
            `CREATE TABLE IF NOT EXISTS logs_recuperacao_senha (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                evento TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                detalhes TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS codigos_recuperacao_ativos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                codigo_hash TEXT NOT NULL,
                tentativas INTEGER DEFAULT 0,
                expiracao DATETIME NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS historico_senhas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                hash_senha_anterior TEXT NOT NULL,
                data_alteracao DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS tentativas_recuperacao (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                email TEXT,
                tentativas INTEGER DEFAULT 1,
                bloqueado_ate DATETIME,
                data_primeira_tentativa DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_ultima_tentativa DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        let tabelasCriadas = 0;
        
        tabelas.forEach((sql, index) => {
            db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Erro criando tabela ${index + 1}:`, err.message);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Tabela ${index + 1} criada/verificada`);
                tabelasCriadas++;
                
                if (tabelasCriadas === tabelas.length) {
                    // Criar índices
                    const indices = [
                        'CREATE INDEX IF NOT EXISTS idx_logs_email ON logs_recuperacao_senha(email)',
                        'CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_recuperacao_senha(data_criacao)',
                        'CREATE INDEX IF NOT EXISTS idx_codigos_email ON codigos_recuperacao_ativos(email)',
                        'CREATE INDEX IF NOT EXISTS idx_codigos_expiracao ON codigos_recuperacao_ativos(expiracao)',
                        'CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_recuperacao(ip_address)',
                        'CREATE INDEX IF NOT EXISTS idx_tentativas_email ON tentativas_recuperacao(email)'
                    ];
                    
                    let indicesCriados = 0;
                    indices.forEach((sql, idx) => {
                        db.run(sql, (err) => {
                            if (err) {
                                console.error(`❌ Erro criando índice ${idx + 1}:`, err.message);
                            } else {
                                console.log(`📊 Índice ${idx + 1} criado`);
                            }
                            
                            indicesCriados++;
                            if (indicesCriados === indices.length) {
                                db.close((err) => {
                                    if (err) {
                                        console.error('❌ Erro fechando banco:', err.message);
                                        reject(err);
                                    } else {
                                        console.log('🎉 Banco SQLite configurado com sucesso!');
                                        console.log('📁 Localização:', dbPath);
                                        resolve(dbPath);
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    });
}

// Verificar se sqlite3 está instalado
try {
    require('sqlite3');
    console.log('✅ SQLite3 disponível');
    criarBancoLocal().catch(console.error);
} catch (error) {
    console.log('❌ SQLite3 não instalado');
    console.log('📦 Instale com: npm install sqlite3');
    console.log('🔄 Continuando sem banco local...');
}
