# 🎨 Portal Components System

Sistema completo de componentes UI reutilizáveis para o Portal Dr. Marcio.

## 🌟 Componentes Disponíveis

### 🪟 Modal Component
Modal responsivo e acessível com diferentes tamanhos.

```javascript
// Exemplo básico
const modal = showModal({
    title: 'Confirmação',
    content: '<p>Deseja realmente excluir este paciente?</p>',
    size: 'medium',
    closable: true
});

// Modal customizado
const modal = window.PortalComponents.create('modal', {
    title: 'Detalhes do Paciente',
    content: document.getElementById('patient-details').innerHTML,
    size: 'large'
});
modal.open();
```

**Tamanhos disponíveis:**
- `small` - 400px máximo
- `medium` - 600px máximo (padrão)
- `large` - 800px máximo
- `xlarge` - 1200px máximo

### 🚨 Alert Component
Sistema de notificações com tipos visuais distintos.

```javascript
// Alert simples
showAlert({
    type: 'success',
    title: 'Sucesso!',
    message: 'Paciente cadastrado com sucesso.',
    timeout: 5000
});

// Alert com ações
showAlert({
    type: 'warning',
    title: 'Atenção',
    message: 'Existem consultas não confirmadas.',
    timeout: 0, // Não fecha automaticamente
    actions: [
        {
            id: 'confirm',
            label: 'Confirmar Todas',
            callback: () => confirmAllAppointments(),
            closeOnClick: true
        },
        {
            id: 'later',
            label: 'Mais Tarde',
            callback: () => console.log('Adiado'),
            closeOnClick: true
        }
    ]
});
```

**Tipos disponíveis:**
- `success` ✅ - Operações bem-sucedidas
- `error` ❌ - Erros e falhas
- `warning` ⚠️ - Avisos importantes
- `info` ℹ️ - Informações gerais

### 📋 Card Component
Cards flexíveis para exibição de conteúdo estruturado.

```javascript
// Card básico
const card = createCard({
    title: 'Consultas do Dia',
    content: '<p>5 consultas agendadas para hoje</p>',
    footer: 'Última atualização: há 2 minutos'
});
card.mount('#dashboard-cards');

// Card com ações
const card = createCard({
    title: 'João Silva',
    content: `
        <p><strong>Idade:</strong> 45 anos</p>
        <p><strong>Último atendimento:</strong> 15/11/2024</p>
        <p><strong>Status:</strong> Ativo</p>
    `,
    actions: [
        {
            id: 'edit',
            label: 'Editar',
            type: 'primary',
            callback: () => editPatient('123')
        },
        {
            id: 'history',
            label: 'Histórico',
            type: 'secondary',
            callback: () => viewHistory('123')
        }
    ],
    className: 'patient-card'
});
card.mount('.patients-grid');
```

### 📊 Chart Component
Gráficos interativos usando Chart.js.

```javascript
// Gráfico de linha
const chart = createChart({
    type: 'line',
    container: '#revenue-chart',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
            label: 'Consultas',
            data: [12, 19, 3, 5, 2],
            borderColor: '#2c5aa0',
            backgroundColor: 'rgba(44, 90, 160, 0.1)'
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Consultas por Mês'
            }
        }
    }
});

chart.mount();

// Atualizar dados
chart.update({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
        label: 'Consultas',
        data: [12, 19, 3, 5, 2, 8],
        borderColor: '#2c5aa0',
        backgroundColor: 'rgba(44, 90, 160, 0.1)'
    }]
});
```

**Tipos de gráfico:**
- `line` - Gráfico de linha
- `bar` - Gráfico de barras
- `pie` - Gráfico de pizza
- `doughnut` - Gráfico de rosca
- `radar` - Gráfico radar
- `polarArea` - Área polar

### 📅 Calendar Component
Calendário interativo para agendamentos.

```javascript
const calendar = createCalendar({
    container: '#appointment-calendar',
    events: [
        {
            id: '1',
            date: '2024-12-15',
            title: 'Consulta - João Silva',
            time: '14:00'
        },
        {
            id: '2',
            date: '2024-12-15',
            title: 'Consulta - Maria Santos',
            time: '15:30'
        }
    ],
    onDateSelect: (date) => {
        console.log('Data selecionada:', date);
        showAvailableSlots(date);
    },
    onEventClick: (event) => {
        showModal({
            title: 'Detalhes da Consulta',
            content: `
                <h4>${event.title}</h4>
                <p>Data: ${event.date}</p>
                <p>Horário: ${event.time}</p>
            `
        });
    }
});

calendar.mount();

// Adicionar evento
calendar.addEvent({
    id: '3',
    date: '2024-12-16',
    title: 'Consulta - Pedro Lima',
    time: '10:00'
});

// Remover evento
calendar.removeEvent('1');
```

## 🚀 Como Usar

### 1. Incluir os arquivos
```html
<!-- CSS dos componentes -->
<link rel="stylesheet" href="components/portal-components.css">

<!-- JavaScript dos componentes -->
<script src="components/portal-components.js"></script>
```

### 2. Usar as funções globais
```javascript
// Modal
const modal = showModal({ title: 'Título', content: 'Conteúdo' });

// Alert
showAlert({ type: 'success', message: 'Operação realizada!' });

// Card
const card = createCard({ title: 'Card', content: 'Conteúdo' });
card.mount('#container');

// Chart
const chart = createChart({ type: 'bar', container: '#chart' });
chart.mount();

// Calendar
const calendar = createCalendar({ container: '#calendar' });
calendar.mount();
```

### 3. Usar o sistema de componentes
```javascript
// Criar instância diretamente
const modal = window.PortalComponents.create('modal', options);
const alert = window.PortalComponents.create('alert', options);
const card = window.PortalComponents.create('card', options);
```

## 🎨 Personalização

### CSS Custom Properties
```css
:root {
    --portal-primary-color: #2c5aa0;
    --portal-success-color: #28a745;
    --portal-warning-color: #ffc107;
    --portal-error-color: #dc3545;
    --portal-info-color: #17a2b8;
    
    --portal-border-radius: 12px;
    --portal-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    --portal-transition: all 0.3s ease;
}
```

### Temas Personalizados
```css
/* Tema escuro */
.dark-theme .portal-modal,
.dark-theme .portal-card {
    background: #2d3748;
    color: #e2e8f0;
}

.dark-theme .portal-modal-header,
.dark-theme .portal-card-header {
    background: #4a5568;
    border-color: #4a5568;
}
```

## 📱 Responsividade

Todos os componentes são totalmente responsivos:

- **Desktop:** Layout completo com todas as funcionalidades
- **Tablet:** Adaptação de tamanhos e espaçamentos
- **Mobile:** Interface otimizada para toque, modals em tela cheia quando necessário

## 🔧 Integração com Analytics

Todos os componentes geram eventos de analytics automaticamente:

```javascript
// Eventos gerados automaticamente
- modal_opened: { title, size }
- modal_closed: { title }
- alert_shown: { type, title }
- calendar_date_selected: { date }
- chart_created: { type, dataPoints }
```

## 🎯 Exemplos Práticos

### Dashboard de Consultas
```javascript
// Card com estatísticas
const statsCard = createCard({
    title: 'Consultas Hoje',
    content: `
        <div class="stats-grid">
            <div class="stat">
                <h3>8</h3>
                <p>Agendadas</p>
            </div>
            <div class="stat">
                <h3>6</h3>
                <p>Confirmadas</p>
            </div>
            <div class="stat">
                <h3>2</h3>
                <p>Pendentes</p>
            </div>
        </div>
    `,
    actions: [
        {
            id: 'view-all',
            label: 'Ver Todas',
            type: 'primary',
            callback: () => location.href = '/agendamentos'
        }
    ]
});
statsCard.mount('#dashboard');
```

### Confirmação de Exclusão
```javascript
function confirmDelete(patientId, patientName) {
    showModal({
        title: 'Confirmar Exclusão',
        content: `
            <p>Deseja realmente excluir o paciente <strong>${patientName}</strong>?</p>
            <p class="text-warning">⚠️ Esta ação não pode ser desfeita.</p>
            <div class="modal-actions">
                <button class="btn-danger" onclick="deletePatient('${patientId}')">
                    Excluir
                </button>
                <button class="btn-secondary" onclick="closeModal()">
                    Cancelar
                </button>
            </div>
        `,
        size: 'small'
    });
}
```

### Sistema de Notificações
```javascript
class NotificationSystem {
    static success(message) {
        showAlert({ type: 'success', message, timeout: 3000 });
    }
    
    static error(message) {
        showAlert({ type: 'error', message, timeout: 0 });
    }
    
    static warning(message, actions = []) {
        showAlert({ type: 'warning', message, actions, timeout: 8000 });
    }
    
    static info(message) {
        showAlert({ type: 'info', message, timeout: 5000 });
    }
}

// Uso
NotificationSystem.success('Paciente cadastrado com sucesso!');
NotificationSystem.error('Erro ao conectar com o servidor.');
```

## 🚀 Próximas Funcionalidades

- [ ] Componente Table com filtros e paginação
- [ ] Componente Form com validação automática
- [ ] Componente Upload de arquivos
- [ ] Componente Timeline para histórico médico
- [ ] Componente Kanban para fluxo de atendimento
- [ ] Temas personalizáveis
- [ ] Suporte a PWA para componentes offline
