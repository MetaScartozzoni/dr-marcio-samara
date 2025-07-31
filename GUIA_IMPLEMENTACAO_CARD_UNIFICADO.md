# 🚀 IMPLEMENTAÇÃO DO CARD UNIFICADO - GUIA PRÁTICO

## 📋 **STATUS PADRONIZADO IMPLEMENTADO:**

### **🎨 CORES E SIGNIFICADOS:**
- 🟢 **OnTime** - Verde (#28a745) - Tudo dentro do prazo
- 🟡 **Pendente** - Amarelo (#ffc107) - Aguardando ação  
- 🔵 **Aguardando** - Azul (#17a2b8) - Dependência externa
- ✅ **Realizado** - Verde claro (#20c997) - Concluído
- 🔴 **Crítico** - Vermelho (#dc3545) - Urgente/Atrasado

### **⚡ FUNCIONALIDADES MANTIDAS:**
- ✅ **"Recado"** (antigo "Detalhes") - Modal para observações
- ✅ **"Evoluir"** - Modal para registrar evolução
- ✅ **"Aniversários"** - Marcos importantes sempre visíveis
- ✅ **Navegação integrada** entre todos os sistemas

---

## 🏗️ **COMO IMPLEMENTAR NOS SISTEMAS EXISTENTES:**

### **1️⃣ PRONTUÁRIOS.HTML:**

```html
<!-- Adicionar no <head> -->
<link rel="stylesheet" href="/card-unificado.css">
<script src="/card-unificado.js"></script>

<!-- Substituir a função renderizarProntuarios() -->
<script>
function renderizarProntuarios() {
    const grid = document.getElementById('prontuariosGrid');
    
    if (prontuariosFiltrados.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Nenhum prontuário encontrado</h3>
                <p>Tente ajustar os termos de busca ou crie um novo prontuário</p>
            </div>
        `;
        return;
    }

    // Usar o card unificado
    grid.innerHTML = prontuariosFiltrados.map(prontuario => {
        return cardUnificado.criarCard({
            id: prontuario.id,
            nome: prontuario.nome,
            cpf: prontuario.cpf,
            telefone: prontuario.telefone,
            email: prontuario.email,
            dataNascimento: prontuario.dataNascimento,
            dataCriacao: prontuario.dataCriacao,
            totalConsultas: prontuario.totalConsultas,
            ultimaConsulta: prontuario.ultimaConsulta,
            primeiraConsulta: prontuario.primeiraConsulta,
            proximoRetorno: prontuario.proximoRetorno,
            status: prontuario.status || 'ativo'
        });
    }).join('');
}
</script>
```

### **2️⃣ QUADRO-EVOLUTIVO.HTML:**

```html
<!-- Adicionar no <head> -->
<link rel="stylesheet" href="/card-unificado.css">
<script src="/card-unificado.js"></script>

<!-- Substituir a função renderizarPacientes() -->
<script>
function renderizarPacientes() {
    const container = document.getElementById('pacientesContainer');
    
    if (pacientesFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Nenhum paciente encontrado</h3>
                <p>Não há pacientes cadastrados ou todos foram filtrados</p>
            </div>
        `;
        return;
    }

    // Usar o card unificado
    container.innerHTML = `
        <div class="cards-grid">
            ${pacientesFiltrados.map(paciente => {
                // Preparar dados para o card unificado
                return cardUnificado.criarCard({
                    id: paciente.id,
                    nome: paciente.nome,
                    telefone: paciente.telefone,
                    email: paciente.email,
                    status: paciente.status, // critico, acompanhamento, estavel, aguardando
                    ultimaEvolucao: paciente.ultimaEvolucao,
                    ultimaConsulta: paciente.dataUltimaConsulta,
                    primeiraConsulta: paciente.primeiraConsulta,
                    dataCirurgia: paciente.dataCirurgia,
                    proximoRetorno: paciente.proximoRetorno,
                    evolucoes: paciente.evolucoes
                });
            }).join('')}
        </div>
    `;
}
</script>
```

### **3️⃣ JORNADA-PACIENTE.HTML:**

```html
<!-- Adicionar no <head> -->
<link rel="stylesheet" href="/card-unificado.css">
<script src="/card-unificado.js"></script>

<!-- Substituir a função carregarJornadaPacientes() -->
<script>
function carregarJornadaPacientes() {
    const grid = document.getElementById('jornadaGrid');
    
    if (jornadaPacientes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-route"></i>
                <h3>Nenhuma jornada ativa</h3>
                <p>Não há pacientes em jornada no momento</p>
            </div>
        `;
        return;
    }

    // Usar o card unificado
    grid.innerHTML = `
        <div class="cards-grid">
            ${jornadaPacientes.map(jornada => {
                return cardUnificado.criarCard({
                    id: jornada.id,
                    nome: jornada.paciente.nome,
                    telefone: jornada.paciente.telefone,
                    email: jornada.paciente.email,
                    etapaAtual: jornada.etapaAtual,
                    proximaAcao: jornada.proximaAcao,
                    prazo: jornada.prazo,
                    prioridade: jornada.prioridade, // urgente, atencao, normal, baixa
                    observacoes: jornada.observacoes,
                    primeiraConsulta: jornada.primeiraConsulta,
                    dataCirurgia: jornada.dataCirurgia,
                    proximoRetorno: jornada.proximoRetorno
                });
            }).join('')}
        </div>
    `;
}
</script>
```

---

## 🎮 **EXEMPLO DE USO COMPLETO:**

### **HTML Base:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema Unificado - Portal Dr. Marcio</title>
    
    <!-- CSS Unificado -->
    <link rel="stylesheet" href="/card-unificado.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Container dos Cards -->
    <div class="cards-grid" id="cardsContainer">
        <!-- Cards serão inseridos aqui -->
    </div>

    <!-- CSS para Modais -->
    <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .modal-content {
            background: white;
            border-radius: 10px;
            padding: 0;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-body {
            padding: 20px;
        }

        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
    </style>

    <!-- JavaScript Unificado -->
    <script src="/card-unificado.js"></script>
    
    <!-- Script de Exemplo -->
    <script>
        // Dados de exemplo
        const pacientesExemplo = [
            {
                id: 'PAC001',
                nome: 'Maria Silva',
                telefone: '(11) 99999-1111',
                email: 'maria@email.com',
                cpf: '123.456.789-00',
                status: 'critico',
                primeiraConsulta: '2025-01-15',
                dataCirurgia: '2025-02-05',
                proximoRetorno: '2025-08-01', // Hoje
                ultimaConsulta: '2025-07-15',
                ultimaEvolucao: 'Pós-operatório 15 dias - Boa cicatrização'
            },
            {
                id: 'PAC002', 
                nome: 'João Santos',
                telefone: '(11) 99999-2222',
                email: 'joao@email.com',
                status: 'ontime',
                primeiraConsulta: '2025-07-20',
                proximoRetorno: '2025-08-10',
                proximaAcao: 'Agendar data da cirurgia',
                prioridade: 'normal'
            },
            {
                id: 'PAC003',
                nome: 'Ana Costa',
                telefone: '(11) 99999-3333',
                email: 'ana@email.com',
                status: 'pendente',
                primeiraConsulta: '2025-06-10',
                ultimaConsulta: '2025-07-20',
                proximaAcao: 'Aguardando retorno dos exames',
                prioridade: 'atencao'
            }
        ];

        // Renderizar cards de exemplo
        function renderizarExemplo() {
            const container = document.getElementById('cardsContainer');
            
            container.innerHTML = pacientesExemplo.map(paciente => {
                return cardUnificado.criarCard(paciente);
            }).join('');
        }

        // Executar quando a página carregar
        document.addEventListener('DOMContentLoaded', function() {
            renderizarExemplo();
        });
    </script>
</body>
</html>
```

---

## 🎯 **RECURSOS DO CARD UNIFICADO:**

### **✅ FUNCIONALIDADES PRINCIPAIS:**
- **Status visual padronizado** com cores consistentes
- **"Recado" e "Evoluir"** mantidos e funcionais
- **"Aniversários"** sempre visíveis para acesso rápido
- **Navegação integrada** entre todos os sistemas
- **Responsivo** para dispositivos móveis

### **✅ INTERAÇÕES:**
- **Clique nos marcos** → Abre Caderno Digital na data específica
- **Botão "Recado"** → Modal para adicionar observações
- **Botão "Evoluir"** → Modal para registrar evolução
- **Botões de navegação** → Acesso rápido aos outros sistemas

### **✅ AUTOMAÇÕES:**
- **Status automático** baseado em regras por sistema
- **Notificações** contabilizadas automaticamente
- **Marcos importantes** extraídos dos dados do paciente
- **Tempo restante** calculado dinamicamente

---

## 🚀 **PRÓXIMOS PASSOS:**

### **FASE 1** - Implementação Base:
1. ✅ Adicionar CSS e JS unificado nos 3 sistemas
2. ✅ Substituir renderização de cards existente
3. ✅ Testar navegação entre sistemas

### **FASE 2** - Refinamentos:
1. 🔄 Integrar com backend real (APIs)
2. 🔄 Implementar salvamento de recados/evoluções
3. 🔄 Sincronizar status entre sistemas

### **FASE 3** - Melhorias:
1. 🔄 Notificações em tempo real
2. 🔄 Filtros e busca avançada
3. 🔄 Relatórios e analytics

**O sistema agora tem uma interface visual unificada mantendo as funcionalidades específicas de cada módulo, com status padronizado e navegação integrada! 🎯**
