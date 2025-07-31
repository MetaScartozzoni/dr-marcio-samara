// ========== CONFIGURAÇÕES DO SISTEMA ==========

const CONFIG = {
    // URLs da API
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://portal-dr-marcio-production.up.railway.app',
    
    // Endpoints
    ENDPOINTS: {
        ORCAMENTOS: '/api/orcamentos',
        PACIENTES: '/api/pacientes',
        AGENDAMENTOS: '/api/agendamentos',
        USUARIOS: '/api/usuarios',
        AUTH: '/api/auth'
    },
    
    // Configurações de UI
    UI: {
        NOTIFICATION_DURATION: 3000,
        DEBOUNCE_DELAY: 300,
        TABLE_PAGE_SIZE: 20,
        AUTO_SAVE_DELAY: 1000
    },
    
    // Validações
    VALIDATION: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
        MIN_PASSWORD_LENGTH: 8,
        PHONE_PATTERN: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Configurações de negócio
    BUSINESS: {
        DEFAULT_ORCAMENTO_VALIDADE_DIAS: 30,
        HORARIOS_CONSULTORIO: [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
            '16:00', '16:30', '17:00', '17:30'
        ],
        DURACAO_CONSULTA_PADRAO: 60, // minutos
        DURACAO_CIRURGIA_PADRAO: 180, // minutos
    }
};

// ========== CLASSE PARA GERENCIAR CONFIGURAÇÕES ==========

class ConfigManager {
    static get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], CONFIG);
    }
    
    static getApiUrl(endpoint) {
        return CONFIG.API_BASE_URL + CONFIG.ENDPOINTS[endpoint];
    }
    
    static isProduction() {
        return process.env.NODE_ENV === 'production';
    }
    
    static isDevelopment() {
        return !this.isProduction();
    }
}

// ========== EXEMPLO DE INTEGRAÇÃO COM BACKEND ==========

/**
 * Estrutura sugerida para o backend (Node.js/Express)
 * 
 * 1. Instalar dependências:
 * npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken
 * npm install mysql2 sequelize  // Para MySQL
 * ou
 * npm install postgresql pg  // Para PostgreSQL
 * 
 * 2. Estrutura de pastas:
 * /backend
 *   /controllers
 *   /models
 *   /routes
 *   /middleware
 *   /config
 *   server.js
 * 
 * 3. Exemplo de servidor básico (server.js):
 */

const EXPRESS_SERVER_EXAMPLE = `
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/orcamentos', require('./routes/orcamentos'));
app.use('/api/agendamentos', require('./routes/agendamentos'));

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Servidor rodando na porta \${PORT}\`);
});
`;

// ========== SCHEMAS DE DADOS SUGERIDOS ==========

const DATABASE_SCHEMAS = {
    // Tabela de usuários
    USUARIOS: `
    CREATE TABLE usuarios (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        tipo ENUM('admin', 'funcionario') DEFAULT 'funcionario',
        autorizado BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_ultima_atividade TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE
    );`,
    
    // Tabela de pacientes
    PACIENTES: `
    CREATE TABLE pacientes (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(20),
        data_nascimento DATE,
        cpf VARCHAR(14),
        endereco TEXT,
        observacoes TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_ultima_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE
    );`,
    
    // Tabela de orçamentos
    ORCAMENTOS: `
    CREATE TABLE orcamentos (
        id VARCHAR(50) PRIMARY KEY,
        paciente_id VARCHAR(50) NOT NULL,
        data_consulta DATE NOT NULL,
        data_orcamento DATE NOT NULL,
        procedimento_principal VARCHAR(255) NOT NULL,
        procedimentos_adicionais TEXT,
        valor_total DECIMAL(10,2) NOT NULL,
        valor_anestesia DECIMAL(10,2) DEFAULT 0,
        valor_hospital DECIMAL(10,2) DEFAULT 0,
        valor_material DECIMAL(10,2) DEFAULT 0,
        status_orcamento ENUM('Pendente', 'Enviado', 'Aceito', 'Rejeitado') DEFAULT 'Pendente',
        forma_pagamento VARCHAR(100),
        validade DATE NOT NULL,
        pagamento_status ENUM('Pendente', 'Aguardando Entrada', 'Entrada Paga', 'Pago') DEFAULT 'Pendente',
        observacoes TEXT,
        pdf_path VARCHAR(500),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_ultima_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    );`,
    
    // Tabela de agendamentos
    AGENDAMENTOS: `
    CREATE TABLE agendamentos (
        id VARCHAR(50) PRIMARY KEY,
        paciente_id VARCHAR(50) NOT NULL,
        orcamento_id VARCHAR(50),
        tipo_agendamento ENUM('consulta', 'cirurgia', 'retorno', 'avaliacao') NOT NULL,
        data_agendamento DATE NOT NULL,
        hora_agendamento TIME NOT NULL,
        duracao_minutos INT DEFAULT 60,
        status_agendamento ENUM('Agendado', 'Confirmado', 'Realizado', 'Cancelado') DEFAULT 'Agendado',
        observacoes TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_ultima_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
        FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id)
    );`
};

// ========== EXEMPLOS DE CONTROLLERS ==========

const CONTROLLER_EXAMPLES = {
    // Controller de orçamentos
    ORCAMENTOS: `
    const OrcamentoController = {
        async listar(req, res) {
            try {
                const orcamentos = await Orcamento.findAll({
                    include: ['paciente'],
                    order: [['data_criacao', 'DESC']]
                });
                res.json(orcamentos);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
        
        async criar(req, res) {
            try {
                const orcamento = await Orcamento.create(req.body);
                res.status(201).json(orcamento);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        },
        
        async atualizar(req, res) {
            try {
                const { id } = req.params;
                await Orcamento.update(req.body, { where: { id } });
                const orcamento = await Orcamento.findByPk(id);
                res.json(orcamento);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        },
        
        async deletar(req, res) {
            try {
                const { id } = req.params;
                await Orcamento.destroy({ where: { id } });
                res.status(204).send();
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        }
    };`,
    
    // Controller de autenticação
    AUTH: `
    const AuthController = {
        async login(req, res) {
            try {
                const { email, senha } = req.body;
                const usuario = await Usuario.findOne({ where: { email } });
                
                if (!usuario || !await bcrypt.compare(senha, usuario.senha_hash)) {
                    return res.status(401).json({ error: 'Credenciais inválidas' });
                }
                
                if (!usuario.ativo || (usuario.tipo === 'funcionario' && !usuario.autorizado)) {
                    return res.status(403).json({ error: 'Acesso não autorizado' });
                }
                
                const token = jwt.sign(
                    { id: usuario.id, tipo: usuario.tipo },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.json({
                    token,
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        tipo: usuario.tipo,
                        autorizado: usuario.autorizado
                    }
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
        
        async verificarToken(req, res, next) {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return res.status(401).json({ error: 'Token não fornecido' });
                }
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.usuario = decoded;
                next();
            } catch (error) {
                res.status(401).json({ error: 'Token inválido' });
            }
        }
    };`
};

// ========== MIDDLEWARE DE SEGURANÇA ==========

const SECURITY_MIDDLEWARE = `
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use('/api/', limiter);

// Middleware de validação de entrada
const { body, validationResult } = require('express-validator');

const validarOrcamento = [
    body('paciente_id').notEmpty().withMessage('Paciente é obrigatório'),
    body('procedimento_principal').notEmpty().withMessage('Procedimento é obrigatório'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
    body('data_consulta').isDate().withMessage('Data de consulta inválida'),
    body('validade').isDate().withMessage('Data de validade inválida'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
`;

// ========== SCRIPTS DE DEPLOY ==========

const DEPLOY_SCRIPTS = {
    // package.json scripts
    PACKAGE_JSON: `
    {
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "test": "jest",
            "build": "npm run build:frontend && npm run build:backend",
            "build:frontend": "webpack --mode=production",
            "build:backend": "echo 'Backend build completed'",
            "deploy": "npm run build && railway deploy"
        }
    }`,
    
    // Railway.toml
    RAILWAY_CONFIG: `
    [build]
    builder = "nixpacks"
    
    [deploy]
    healthcheckPath = "/health"
    healthcheckTimeout = 30
    restartPolicyType = "ON_FAILURE"
    restartPolicyMaxRetries = 3
    
    [env]
    NODE_ENV = "production"
    `,
    
    // Dockerfile
    DOCKERFILE: `
    FROM node:18-alpine
    
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    COPY . .
    
    EXPOSE 3000
    
    USER node
    
    CMD ["node", "server.js"]
    `
};

// ========== TESTES AUTOMATIZADOS ==========

const TEST_EXAMPLES = `
// tests/orcamento.test.js
const request = require('supertest');
const app = require('../server');

describe('Orçamentos API', () => {
    test('GET /api/orcamentos - deve retornar lista de orçamentos', async () => {
        const response = await request(app)
            .get('/api/orcamentos')
            .expect(200);
        
        expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('POST /api/orcamentos - deve criar novo orçamento', async () => {
        const novoOrcamento = {
            paciente_id: 'PAC001',
            procedimento_principal: 'Rinoplastia',
            valor_total: 8500.00,
            data_consulta: '2025-08-01',
            validade: '2025-09-01',
            forma_pagamento: '3x'
        };
        
        const response = await request(app)
            .post('/api/orcamentos')
            .send(novoOrcamento)
            .expect(201);
        
        expect(response.body.id).toBeDefined();
        expect(response.body.procedimento_principal).toBe('Rinoplastia');
    });
});
`;

// Exportar configurações para uso no frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        ConfigManager,
        DATABASE_SCHEMAS,
        CONTROLLER_EXAMPLES,
        SECURITY_MIDDLEWARE,
        DEPLOY_SCRIPTS,
        TEST_EXAMPLES
    };
}
