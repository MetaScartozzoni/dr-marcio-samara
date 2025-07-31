# 🎯 CARD UNIFICADO - IMPLEMENTAÇÃO COM STATUS PADRONIZADO

## 📋 **FUNCIONALIDADES MANTIDAS:**
- ✅ **"Recado"** (antigo "Detalhes") 
- ✅ **"Evoluir"** (mantido)
- ✅ **Status Padronizado** em todos os sistemas

---

## 🎨 **SISTEMA DE STATUS UNIFICADO:**

### **📊 STATUS PRINCIPAIS:**
- 🟢 **OnTime** - Verde (#28a745) - Tudo dentro do prazo
- 🟡 **Pendente** - Amarelo (#ffc107) - Aguardando ação
- 🔵 **Aguardando** - Azul (#17a2b8) - Dependência externa
- ✅ **Realizado** - Verde claro (#20c997) - Concluído
- 🔴 **Crítico** - Vermelho (#dc3545) - Urgente/Atrasado

### **🎯 APLICAÇÃO POR SISTEMA:**

#### **📊 QUADRO EVOLUTIVO:**
- **OnTime**: Evolução dentro do esperado
- **Pendente**: Aguardando retorno/consulta
- **Aguardando**: Esperando exames/resultados
- **Realizado**: Consulta/procedimento concluído
- **Crítico**: Necessita atenção médica urgente

#### **🚀 JORNADA PACIENTE:**
- **OnTime**: Tarefas em dia, prazos ok
- **Pendente**: Ação da equipe necessária
- **Aguardando**: Resposta do paciente
- **Realizado**: Etapa concluída
- **Crítico**: Prazo vencido, urgente

#### **📂 PRONTUÁRIOS:**
- **OnTime**: Documentação em dia
- **Pendente**: Dados a completar
- **Aguardando**: Documentos pendentes
- **Realizado**: Cadastro completo
- **Crítico**: Informações críticas faltando

---

## 🏗️ **ESTRUTURA DO CARD UNIFICADO:**

```html
<div class="card-paciente unified" data-paciente-id="${id}" data-sistema="${sistema}">
    <!-- Header Unificado -->
    <div class="card-header">
        <div class="paciente-info">
            <h3>👤 ${nome}</h3>
            <div class="paciente-meta">
                <span class="prontuario-id">${id}</span>
                <span class="status-badge ${status}">${statusText}</span>
            </div>
        </div>
        <div class="notificacao-container">
            <span class="notificacao-badge" data-count="${notificacoes}"></span>
        </div>
    </div>

    <!-- Dados Básicos (sempre visíveis) -->
    <div class="dados-basicos">
        <div class="dado-item">
            <i class="fas fa-phone"></i> ${telefone}
        </div>
        <div class="dado-item">
            <i class="fas fa-envelope"></i> ${email}
        </div>
    </div>

    <!-- Contexto Específico do Sistema -->
    <div class="card-context ${sistema}">
        <!-- Conteúdo varia conforme o sistema -->
    </div>

    <!-- Marcos Importantes ("Aniversários") -->
    <div class="marcos-importantes">
        <div class="marco-item ${marco.status}" data-tipo="${marco.tipo}">
            <span class="marco-icon">${marco.icon}</span>
            <span class="marco-data">${marco.data}</span>
        </div>
    </div>

    <!-- Ações Unificadas -->
    <div class="card-actions">
        <div class="actions-primary">
            <button class="btn-action recado" onclick="abrirRecado('${id}')">
                <i class="fas fa-sticky-note"></i> Recado
            </button>
            <button class="btn-action evoluir" onclick="abrirEvolucao('${id}')">
                <i class="fas fa-chart-line"></i> Evoluir
            </button>
        </div>
        
        <div class="actions-navigation">
            <button class="btn-nav caderno" onclick="abrirCaderno('${id}')" title="Caderno Digital">
                <i class="fas fa-book-medical"></i>
            </button>
            <button class="btn-nav evolucao" onclick="abrirQuadroEvolucao('${id}')" title="Quadro Evolução">
                <i class="fas fa-chart-bar"></i>
            </button>
            <button class="btn-nav jornada" onclick="abrirJornada('${id}')" title="Jornada">
                <i class="fas fa-route"></i>
            </button>
        </div>
    </div>
</div>
```

---

## 🎨 **CSS UNIFICADO:**

```css
/* Card Unificado Base */
.card-paciente.unified {
    background: white;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    border-left: 5px solid var(--status-color);
    position: relative;
}

.card-paciente.unified:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Header Unificado */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.paciente-info h3 {
    color: #1e3c72;
    font-size: 18px;
    margin-bottom: 5px;
}

.paciente-meta {
    display: flex;
    gap: 10px;
    align-items: center;
}

.prontuario-id {
    background: #667eea;
    color: white;
    padding: 3px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
}

/* Status Badges Padronizados */
.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.ontime {
    background: #28a745;
    color: white;
}

.status-badge.pendente {
    background: #ffc107;
    color: #212529;
}

.status-badge.aguardando {
    background: #17a2b8;
    color: white;
}

.status-badge.realizado {
    background: #20c997;
    color: white;
}

.status-badge.critico {
    background: #dc3545;
    color: white;
    animation: pulse 2s infinite;
}

/* Notificação Badge */
.notificacao-badge {
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    animation: bounce 2s infinite;
}

.notificacao-badge:empty {
    display: none;
}

/* Dados Básicos */
.dados-basicos {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    font-size: 13px;
    color: #666;
}

.dado-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Marcos Importantes */
.marcos-importantes {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.marco-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.marco-item:hover {
    transform: scale(1.05);
}

.marco-item.primeira-consulta {
    background: #e3f2fd;
    color: #1976d2;
}

.marco-item.cirurgia {
    background: #fce4ec;
    color: #c2185b;
}

.marco-item.retorno {
    background: #e8f5e8;
    color: #388e3c;
}

.marco-item.urgente {
    background: #ffebee;
    color: #d32f2f;
    animation: pulse 2s infinite;
}

/* Ações do Card */
.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
}

.actions-primary {
    display: flex;
    gap: 10px;
}

.actions-navigation {
    display: flex;
    gap: 5px;
}

.btn-action {
    padding: 8px 15px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-action.recado {
    background: #17a2b8;
    color: white;
}

.btn-action.recado:hover {
    background: #138496;
}

.btn-action.evoluir {
    background: #28a745;
    color: white;
}

.btn-action.evoluir:hover {
    background: #218838;
}

.btn-nav {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: #f8f9fa;
    color: #495057;
}

.btn-nav:hover {
    background: #667eea;
    color: white;
    transform: scale(1.1);
}

/* Contextos Específicos */
.card-context.evolucao {
    /* Específico para Quadro Evolução */
}

.card-context.jornada {
    /* Específico para Jornada */
}

.card-context.prontuarios {
    /* Específico para Prontuários */
}

/* Variáveis CSS para Status */
.card-paciente.unified[data-status="ontime"] {
    --status-color: #28a745;
}

.card-paciente.unified[data-status="pendente"] {
    --status-color: #ffc107;
}

.card-paciente.unified[data-status="aguardando"] {
    --status-color: #17a2b8;
}

.card-paciente.unified[data-status="realizado"] {
    --status-color: #20c997;
}

.card-paciente.unified[data-status="critico"] {
    --status-color: #dc3545;
}

/* Animações */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-3px);
    }
    60% {
        transform: translateY(-1px);
    }
}

/* Responsividade */
@media (max-width: 768px) {
    .card-actions {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
    }
    
    .actions-navigation {
        justify-content: center;
    }
    
    .marcos-importantes {
        justify-content: center;
    }
}
```

---

## 🎮 **FUNÇÕES JAVASCRIPT UNIFICADAS:**

```javascript
// Função para criar card unificado
function criarCardUnificado(paciente, sistema) {
    const status = determinarStatus(paciente, sistema);
    const marcos = obterMarcosImportantes(paciente);
    const notificacoes = contarNotificacoes(paciente);
    
    return `
        <div class="card-paciente unified" 
             data-paciente-id="${paciente.id}" 
             data-sistema="${sistema}"
             data-status="${status.tipo}">
            
            <div class="card-header">
                <div class="paciente-info">
                    <h3>👤 ${paciente.nome}</h3>
                    <div class="paciente-meta">
                        <span class="prontuario-id">${paciente.id}</span>
                        <span class="status-badge ${status.tipo}">${status.texto}</span>
                    </div>
                </div>
                <div class="notificacao-container">
                    ${notificacoes > 0 ? `<span class="notificacao-badge">${notificacoes}</span>` : ''}
                </div>
            </div>

            <div class="dados-basicos">
                <div class="dado-item">
                    <i class="fas fa-phone"></i> ${paciente.telefone}
                </div>
                <div class="dado-item">
                    <i class="fas fa-envelope"></i> ${paciente.email}
                </div>
            </div>

            <div class="card-context ${sistema}">
                ${obterConteudoContexto(paciente, sistema)}
            </div>

            <div class="marcos-importantes">
                ${marcos.map(marco => `
                    <div class="marco-item ${marco.status}" 
                         data-tipo="${marco.tipo}"
                         onclick="irParaMarco('${paciente.id}', '${marco.data}')">
                        <span class="marco-icon">${marco.icon}</span>
                        <span class="marco-data">${marco.data}</span>
                    </div>
                `).join('')}
            </div>

            <div class="card-actions">
                <div class="actions-primary">
                    <button class="btn-action recado" onclick="abrirRecado('${paciente.id}')">
                        <i class="fas fa-sticky-note"></i> Recado
                    </button>
                    <button class="btn-action evoluir" onclick="abrirEvolucao('${paciente.id}')">
                        <i class="fas fa-chart-line"></i> Evoluir
                    </button>
                </div>
                
                <div class="actions-navigation">
                    <button class="btn-nav caderno" onclick="abrirCaderno('${paciente.id}')" title="Caderno Digital">
                        <i class="fas fa-book-medical"></i>
                    </button>
                    <button class="btn-nav evolucao" onclick="abrirQuadroEvolucao('${paciente.id}')" title="Quadro Evolução">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn-nav jornada" onclick="abrirJornada('${paciente.id}')" title="Jornada">
                        <i class="fas fa-route"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Determinar status baseado no sistema
function determinarStatus(paciente, sistema) {
    switch(sistema) {
        case 'evolucao':
            return determinarStatusEvolucao(paciente);
        case 'jornada':
            return determinarStatusJornada(paciente);
        case 'prontuarios':
            return determinarStatusProntuario(paciente);
        default:
            return { tipo: 'pendente', texto: 'Pendente' };
    }
}

// Status específicos por sistema
function determinarStatusEvolucao(paciente) {
    if (paciente.ultimaConsulta) {
        const dias = calcularDiasDesdeUltimaConsulta(paciente.ultimaConsulta);
        if (dias > 30) return { tipo: 'critico', texto: 'Crítico' };
        if (dias > 15) return { tipo: 'pendente', texto: 'Pendente' };
        return { tipo: 'ontime', texto: 'OnTime' };
    }
    return { tipo: 'aguardando', texto: 'Aguardando' };
}

function determinarStatusJornada(paciente) {
    if (paciente.prazoVencido) return { tipo: 'critico', texto: 'Crítico' };
    if (paciente.proximaAcao) return { tipo: 'pendente', texto: 'Pendente' };
    if (paciente.aguardandoResposta) return { tipo: 'aguardando', texto: 'Aguardando' };
    if (paciente.etapaConcluida) return { tipo: 'realizado', texto: 'Realizado' };
    return { tipo: 'ontime', texto: 'OnTime' };
}

function determinarStatusProntuario(paciente) {
    if (!paciente.cpf || !paciente.telefone) return { tipo: 'critico', texto: 'Crítico' };
    if (!paciente.email) return { tipo: 'pendente', texto: 'Pendente' };
    return { tipo: 'realizado', texto: 'Realizado' };
}

// Obter marcos importantes
function obterMarcosImportantes(paciente) {
    const marcos = [];
    
    if (paciente.primeiraConsulta) {
        marcos.push({
            tipo: 'primeira-consulta',
            icon: '🏥',
            data: formatarDataCurta(paciente.primeiraConsulta),
            status: 'primeira-consulta'
        });
    }
    
    if (paciente.dataCirurgia) {
        marcos.push({
            tipo: 'cirurgia',
            icon: '⚕️',
            data: formatarDataCurta(paciente.dataCirurgia),
            status: 'cirurgia'
        });
    }
    
    if (paciente.proximoRetorno) {
        const hoje = new Date();
        const retorno = new Date(paciente.proximoRetorno);
        const isUrgente = retorno <= hoje;
        
        marcos.push({
            tipo: 'retorno',
            icon: '🔄',
            data: formatarDataCurta(paciente.proximoRetorno),
            status: isUrgente ? 'urgente' : 'retorno'
        });
    }
    
    return marcos;
}

// Funções de ação
function abrirRecado(pacienteId) {
    // Implementar modal de recado
    console.log('Abrindo recado para paciente:', pacienteId);
}

function abrirEvolucao(pacienteId) {
    // Implementar modal de evolução
    console.log('Abrindo evolução para paciente:', pacienteId);
}

function abrirCaderno(pacienteId) {
    // Redirecionar para caderno digital
    window.open(`/caderno-digital.html?paciente=${pacienteId}`, '_blank');
}

function abrirQuadroEvolucao(pacienteId) {
    // Redirecionar para quadro evolução
    window.open(`/quadro-evolutivo.html?paciente=${pacienteId}`, '_blank');
}

function abrirJornada(pacienteId) {
    // Redirecionar para jornada
    window.open(`/jornada-paciente.html?paciente=${pacienteId}`, '_blank');
}

function irParaMarco(pacienteId, data) {
    // Abrir caderno digital na data específica
    window.open(`/caderno-digital.html?paciente=${pacienteId}&data=${data}`, '_blank');
}
```

---

## 🎯 **BENEFÍCIOS DA IMPLEMENTAÇÃO:**

### ✅ **Status Padronizado:**
- **OnTime** (🟢): Tudo em dia
- **Pendente** (🟡): Ação necessária  
- **Aguardando** (🔵): Dependência externa
- **Realizado** (✅): Concluído
- **Crítico** (🔴): Urgente

### ✅ **Funcionalidades Mantidas:**
- **"Recado"** (antigo Detalhes)
- **"Evoluir"** (mantido)
- **Navegação integrada** entre sistemas

### ✅ **"Aniversários" Sempre Visíveis:**
- **Marcos importantes** em todos os cards
- **Acesso rápido** às datas importantes
- **Indicação visual** de urgência

**Agora todos os sistemas terão a mesma aparência e funcionalidade, mantendo suas características específicas mas com navegação e status unificados! 🚀**
