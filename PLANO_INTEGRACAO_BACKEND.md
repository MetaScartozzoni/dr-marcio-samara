# 🎯 PLANO DE INTEGRAÇÃO BACKEND - PORTAL DR. MARCIO

## 📋 **FLUXO PRINCIPAL INTEGRADO:**

### 1️⃣ **CADASTRO DE PACIENTE** → **AGENDAMENTO** → **PRONTUÁRIO** → **FICHA ATENDIMENTO** → **ORÇAMENTO** → **JORNADA** → **GESTÃO EVOLUÇÃO**

---

## 🏗️ **ESTRUTURA DE DADOS INTEGRADA:**

### 📊 **Tabelas Principais:**

#### `pacientes` (MASTER TABLE)
```sql
CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE,
    endereco TEXT,
    convenio VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ativo',
    
    -- CONTROLE DE ACESSO AO DASHBOARD
    tem_acesso_dashboard BOOLEAN DEFAULT false,
    usuario_id INTEGER REFERENCES usuarios(id), -- NULL se não tem acesso
    
    -- METADADOS
    primeira_consulta DATE,
    total_consultas INTEGER DEFAULT 0,
    valor_total_tratamentos DECIMAL(10,2) DEFAULT 0,
    observacoes_gerais TEXT,
    
    -- AUDITORIA
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER REFERENCES funcionarios(id)
);
```

#### `agendamentos` (Integrado com pacientes)
```sql
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    data_agendamento TIMESTAMP NOT NULL,
    tipo_consulta VARCHAR(100),
    status VARCHAR(50) DEFAULT 'agendado',
    observacoes TEXT,
    
    -- INTEGRAÇÃO COM CADERNO DIGITAL
    caderno_criado BOOLEAN DEFAULT false,
    caderno_id VARCHAR(50),
    
    -- JORNADA
    etapa_jornada VARCHAR(50) DEFAULT 'agendado',
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `prontuarios` (Vinculado ao paciente)
```sql
CREATE TABLE prontuarios (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    numero_prontuario VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    
    -- DOCUMENTOS ASSOCIADOS
    total_fichas_atendimento INTEGER DEFAULT 0,
    total_orcamentos INTEGER DEFAULT 0,
    total_evolucoes INTEGER DEFAULT 0,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `fichas_atendimento` (Documentação clínica)
```sql
CREATE TABLE fichas_atendimento (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    agendamento_id INTEGER REFERENCES agendamentos(id),
    
    -- DADOS CLÍNICOS
    peso DECIMAL(5,2),
    altura DECIMAL(3,2),
    imc DECIMAL(4,2),
    pressao_arterial VARCHAR(20),
    procedimento_desejado VARCHAR(255),
    motivo_principal TEXT,
    historico_medico TEXT,
    medicamentos_uso TEXT,
    alergias TEXT,
    
    -- STATUS
    status VARCHAR(50) DEFAULT 'em_andamento',
    finalizada_em TIMESTAMP,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER REFERENCES funcionarios(id)
);
```

#### `orcamentos` (Gestão financeira)
```sql
CREATE TABLE orcamentos (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    ficha_atendimento_id INTEGER REFERENCES fichas_atendimento(id),
    
    -- DADOS DO ORÇAMENTO
    numero_orcamento VARCHAR(50) UNIQUE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    descricao_procedimento TEXT,
    forma_pagamento VARCHAR(100),
    
    -- STATUS E CONTROLE
    status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviado, aceito, recusado
    enviado_em TIMESTAMP,
    aceito_em TIMESTAMP,
    vencimento DATE,
    
    -- JORNADA INTEGRATION
    etapa_jornada VARCHAR(50) DEFAULT 'elaboracao',
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER REFERENCES funcionarios(id)
);
```

#### `jornada_paciente` (Fluxo automatizado)
```sql
CREATE TABLE jornada_paciente (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    
    -- ETAPAS DO FLUXO
    etapa_atual VARCHAR(50) NOT NULL,
    etapa_anterior VARCHAR(50),
    proxima_acao TEXT,
    prazo_acao TIMESTAMP,
    prioridade VARCHAR(20) DEFAULT 'normal', -- normal, atencao, urgente
    
    -- REFERENCIAS
    agendamento_id INTEGER REFERENCES agendamentos(id),
    orcamento_id INTEGER REFERENCES orcamentos(id),
    
    -- CONTROLE
    status VARCHAR(50) DEFAULT 'ativo',
    observacoes TEXT,
    notificacao_enviada BOOLEAN DEFAULT false,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `gestao_evolucao` (Acompanhamento pós-atendimento)
```sql
CREATE TABLE gestao_evolucao (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id) NOT NULL,
    prontuario_id INTEGER REFERENCES prontuarios(id) NOT NULL,
    
    -- DADOS DA EVOLUÇÃO
    data_evolucao DATE NOT NULL,
    tipo_evolucao VARCHAR(50), -- consulta, retorno, pos_operatorio
    descricao TEXT NOT NULL,
    
    -- IMAGENS/ANEXOS
    fotos_antes TEXT[], -- URLs das fotos
    fotos_depois TEXT[],
    anexos TEXT[],
    
    -- STATUS
    status VARCHAR(50) DEFAULT 'ativa',
    proxima_consulta DATE,
    observacoes TEXT,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER REFERENCES funcionarios(id)
);
```

---

## 🔄 **FLUXO DE INTEGRAÇÃO:**

### **1. CADASTRO DE PACIENTE** (Entrada principal)
```javascript
// src/controllers/paciente.controller.js
async function criarPaciente(req, res) {
    const { nome, cpf, email, telefone, data_nascimento, tem_acesso_dashboard } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Criar registro na tabela pacientes
        const pacienteResult = await client.query(`
            INSERT INTO pacientes (nome, cpf, email, telefone, data_nascimento, tem_acesso_dashboard)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [nome, cpf, email, telefone, data_nascimento, tem_acesso_dashboard]);
        
        const paciente = pacienteResult.rows[0];
        
        // 2. Se tem acesso ao dashboard, criar usuário
        if (tem_acesso_dashboard) {
            const senha_temporaria = gerarSenhaTemporaria();
            const senhaHash = await bcrypt.hash(senha_temporaria, 10);
            
            const usuarioResult = await client.query(`
                INSERT INTO usuarios (nome, email, senha, tipo, paciente_id)
                VALUES ($1, $2, $3, 'paciente', $4)
                RETURNING id
            `, [nome, email, senhaHash, paciente.id]);
            
            // Atualizar paciente com usuario_id
            await client.query(`
                UPDATE pacientes SET usuario_id = $1 WHERE id = $2
            `, [usuarioResult.rows[0].id, paciente.id]);
        }
        
        // 3. Criar prontuário automaticamente
        const numeroProntuario = gerarNumeroProntuario(paciente.id);
        await client.query(`
            INSERT INTO prontuarios (paciente_id, numero_prontuario)
            VALUES ($1, $2)
        `, [paciente.id, numeroProntuario]);
        
        // 4. Inicializar jornada do paciente
        await client.query(`
            INSERT INTO jornada_paciente (paciente_id, etapa_atual, proxima_acao)
            VALUES ($1, 'cadastrado', 'Aguardando primeiro agendamento')
        `, [paciente.id]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            paciente: paciente,
            tem_acesso_dashboard,
            senha_temporaria: tem_acesso_dashboard ? senha_temporaria : null
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
```

### **2. AGENDAMENTO** (Atualiza jornada)
```javascript
// src/controllers/agendamento.controller.js
async function criarAgendamento(req, res) {
    const { paciente_id, data_agendamento, tipo_consulta, criar_caderno } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Criar agendamento
        const agendamentoResult = await client.query(`
            INSERT INTO agendamentos (paciente_id, data_agendamento, tipo_consulta, caderno_criado)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [paciente_id, data_agendamento, tipo_consulta, criar_caderno]);
        
        const agendamento = agendamentoResult.rows[0];
        
        // 2. Atualizar contadores do paciente
        await client.query(`
            UPDATE pacientes 
            SET total_consultas = total_consultas + 1,
                primeira_consulta = COALESCE(primeira_consulta, $2)
            WHERE id = $1
        `, [paciente_id, data_agendamento]);
        
        // 3. Atualizar jornada do paciente
        await client.query(`
            UPDATE jornada_paciente 
            SET etapa_atual = 'agendamento_confirmado',
                proxima_acao = 'Aguardando consulta',
                agendamento_id = $2,
                prazo_acao = $3,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE paciente_id = $1 AND status = 'ativo'
        `, [paciente_id, agendamento.id, data_agendamento]);
        
        await client.query('COMMIT');
        
        res.json({ success: true, agendamento });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
```

### **3. FICHA DE ATENDIMENTO** (Durante consulta)
```javascript
// src/controllers/ficha.controller.js
async function criarFichaAtendimento(req, res) {
    const { 
        paciente_id, 
        agendamento_id,
        peso, altura, pressao_arterial,
        procedimento_desejado, motivo_principal
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Buscar prontuário do paciente
        const prontuarioResult = await client.query(`
            SELECT id FROM prontuarios WHERE paciente_id = $1
        `, [paciente_id]);
        
        const prontuario_id = prontuarioResult.rows[0].id;
        
        // 2. Criar ficha de atendimento
        const fichaResult = await client.query(`
            INSERT INTO fichas_atendimento (
                paciente_id, prontuario_id, agendamento_id,
                peso, altura, pressao_arterial, procedimento_desejado, motivo_principal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [paciente_id, prontuario_id, agendamento_id, peso, altura, pressao_arterial, procedimento_desejado, motivo_principal]);
        
        // 3. Atualizar contadores
        await client.query(`
            UPDATE prontuarios 
            SET total_fichas_atendimento = total_fichas_atendimento + 1
            WHERE id = $1
        `, [prontuario_id]);
        
        // 4. Atualizar status do agendamento
        await client.query(`
            UPDATE agendamentos 
            SET status = 'realizado', etapa_jornada = 'consulta_realizada'
            WHERE id = $1
        `, [agendamento_id]);
        
        // 5. Atualizar jornada para próxima etapa
        await client.query(`
            UPDATE jornada_paciente 
            SET etapa_atual = 'consulta_realizada',
                proxima_acao = 'Elaborar orçamento',
                prazo_acao = CURRENT_TIMESTAMP + INTERVAL '24 hours',
                prioridade = 'atencao',
                atualizado_em = CURRENT_TIMESTAMP
            WHERE paciente_id = $1 AND status = 'ativo'
        `, [paciente_id]);
        
        await client.query('COMMIT');
        
        res.json({ success: true, ficha: fichaResult.rows[0] });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
```

### **4. ORÇAMENTO** (Pós-consulta)
```javascript
// src/controllers/orcamento.controller.js
async function criarOrcamento(req, res) {
    const { 
        paciente_id, 
        ficha_atendimento_id,
        valor_total, 
        descricao_procedimento,
        forma_pagamento 
    } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Gerar número do orçamento
        const numero_orcamento = await gerarNumeroOrcamento();
        
        // 2. Criar orçamento
        const orcamentoResult = await client.query(`
            INSERT INTO orcamentos (
                paciente_id, ficha_atendimento_id, numero_orcamento,
                valor_total, descricao_procedimento, forma_pagamento
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [paciente_id, ficha_atendimento_id, numero_orcamento, valor_total, descricao_procedimento, forma_pagamento]);
        
        const orcamento = orcamentoResult.rows[0];
        
        // 3. Atualizar contadores
        const prontuarioResult = await client.query(`
            SELECT id FROM prontuarios WHERE paciente_id = $1
        `, [paciente_id]);
        
        await client.query(`
            UPDATE prontuarios 
            SET total_orcamentos = total_orcamentos + 1
            WHERE id = $1
        `, [prontuarioResult.rows[0].id]);
        
        // 4. Atualizar jornada do paciente
        await client.query(`
            UPDATE jornada_paciente 
            SET etapa_atual = 'orcamento_elaborado',
                proxima_acao = 'Enviar orçamento para paciente',
                orcamento_id = $2,
                prazo_acao = CURRENT_TIMESTAMP + INTERVAL '2 hours',
                prioridade = 'atencao',
                atualizado_em = CURRENT_TIMESTAMP
            WHERE paciente_id = $1 AND status = 'ativo'
        `, [paciente_id, orcamento.id]);
        
        await client.query('COMMIT');
        
        res.json({ success: true, orcamento });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
}
```

---

## 🔧 **IMPLEMENTAÇÃO:**

### **Prioridade 1: Criar Controllers Integrados**
1. `src/controllers/paciente.controller.js`
2. `src/controllers/agendamento.controller.js` (atualizar)
3. `src/controllers/ficha.controller.js` (novo)
4. `src/controllers/orcamento.controller.js` (novo)
5. `src/controllers/jornada.controller.js` (atualizar)

### **Prioridade 2: Criar Services de Integração**
1. `src/services/integracao.service.js` - Orquestrar fluxo completo
2. `src/services/jornada.service.js` - Automatizar etapas
3. `src/services/notificacao.service.js` - Alertas automáticos

### **Prioridade 3: Rotas API Unificadas**
1. `/api/pacientes` - CRUD completo + acesso dashboard
2. `/api/agendamentos` - Integrado com jornada
3. `/api/fichas` - Atendimento clínico
4. `/api/orcamentos` - Gestão financeira
5. `/api/jornada` - Monitoramento de fluxo

---

## 🎯 **RESULTADO ESPERADO:**

### ✅ **Fluxo Automatizado:**
1. **Cadastro** → Cria paciente + prontuário + jornada
2. **Agendamento** → Atualiza jornada + pode criar caderno
3. **Consulta** → Cria ficha + avança jornada
4. **Orçamento** → Elabora + envia + monitora resposta
5. **Evolução** → Acompanha tratamento + resultados

### ✅ **Controle de Acesso:**
- **Todos os pacientes** têm registro completo
- **Apenas selecionados** têm acesso ao Dashboard do Paciente
- **Funcionários** gerenciam todo o fluxo

### ✅ **Integração Completa:**
- **Frontend atual** → APIs unificadas
- **Calendário** → Jornada automática
- **Modal histórico CPF** → Dados centralizados
- **Caderno Digital** → Prontuário integrado

---

## 🚀 **PRÓXIMOS PASSOS:**

1. **Criar estrutura de banco** (migrations)
2. **Implementar controllers** (um por vez)
3. **Testar integração** (frontend → backend)
4. **Deploy gradual** (sem quebrar funcionalidades atuais)

Devo começar implementando essa estrutura?
