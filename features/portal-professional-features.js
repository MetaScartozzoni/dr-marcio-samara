// 🎯 Portal Professional Features - Funcionalidades Avançadas v20250811-1700
class PortalProfessionalFeatures {
    constructor() {
        this.features = new Map();
        this.init();
    }

    init() {
        // Registrar funcionalidades profissionais
        this.registerFeature('dashboard-widgets', new DashboardWidgets());
        this.registerFeature('notification-center', new NotificationCenter());
        this.registerFeature('appointment-manager', new AppointmentManager());
        this.registerFeature('reports-system', new ReportsSystem());
        this.registerFeature('workflow-automation', new WorkflowAutomation());
    }

    registerFeature(name, feature) {
        this.features.set(name, feature);
    }

    getFeature(name) {
        return this.features.get(name);
    }
}

// 📊 Dashboard Widgets System
class DashboardWidgets {
    constructor() {
        this.widgets = [];
        this.container = null;
    }

    init(container) {
        this.container = container;
        this.createDefaultWidgets();
        this.render();
    }

    createDefaultWidgets() {
        // Widget de Estatísticas Rápidas
        this.addWidget({
            id: 'quick-stats',
            title: 'Estatísticas do Dia',
            type: 'stats',
            size: 'medium',
            refresh: true,
            data: {
                consultas_hoje: 12,
                consultas_confirmadas: 10,
                consultas_pendentes: 2,
                receita_dia: 'R$ 2.850,00'
            }
        });

        // Widget de Próximas Consultas
        this.addWidget({
            id: 'next-appointments',
            title: 'Próximas Consultas',
            type: 'list',
            size: 'large',
            refresh: true,
            data: []
        });

        // Widget de Gráfico de Consultas
        this.addWidget({
            id: 'appointments-chart',
            title: 'Consultas - Últimos 7 Dias',
            type: 'chart',
            size: 'medium',
            refresh: true,
            chartConfig: {
                type: 'line',
                data: {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Consultas',
                        data: [8, 12, 6, 10, 15, 4, 0],
                        borderColor: '#2c5aa0',
                        backgroundColor: 'rgba(44, 90, 160, 0.1)'
                    }]
                }
            }
        });

        // Widget de Alertas
        this.addWidget({
            id: 'alerts',
            title: 'Alertas do Sistema',
            type: 'alerts',
            size: 'small',
            data: [
                { type: 'warning', message: '3 consultas aguardando confirmação' },
                { type: 'info', message: 'Backup automático realizado com sucesso' }
            ]
        });
    }

    addWidget(config) {
        this.widgets.push(config);
    }

    render() {
        if (!this.container) return;

        const dashboardGrid = document.createElement('div');
        dashboardGrid.className = 'dashboard-widgets-grid';
        
        this.widgets.forEach(widget => {
            const widgetElement = this.createWidgetElement(widget);
            dashboardGrid.appendChild(widgetElement);
        });

        this.container.appendChild(dashboardGrid);
        this.attachEventListeners();
    }

    createWidgetElement(widget) {
        const widgetDiv = document.createElement('div');
        widgetDiv.className = `dashboard-widget widget-${widget.size} widget-${widget.type}`;
        widgetDiv.id = `widget-${widget.id}`;

        let content = '';
        
        switch (widget.type) {
            case 'stats':
                content = this.createStatsWidget(widget);
                break;
            case 'chart':
                content = this.createChartWidget(widget);
                break;
            case 'list':
                content = this.createListWidget(widget);
                break;
            case 'alerts':
                content = this.createAlertsWidget(widget);
                break;
        }

        widgetDiv.innerHTML = `
            <div class="widget-header">
                <h3>${widget.title}</h3>
                <div class="widget-actions">
                    ${widget.refresh ? '<button class="widget-refresh" data-widget="' + widget.id + '">🔄</button>' : ''}
                    <button class="widget-settings" data-widget="${widget.id}">⚙️</button>
                </div>
            </div>
            <div class="widget-content">
                ${content}
            </div>
        `;

        return widgetDiv;
    }

    createStatsWidget(widget) {
        const stats = Object.entries(widget.data).map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `
                <div class="stat-item">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            `;
        }).join('');

        return `<div class="stats-grid">${stats}</div>`;
    }

    createChartWidget(widget) {
        const chartId = `chart-${widget.id}`;
        setTimeout(() => {
            const chart = createChart({
                container: `#${chartId}`,
                type: widget.chartConfig.type,
                data: widget.chartConfig.data
            });
            chart.mount();
        }, 100);

        return `<div id="${chartId}" class="widget-chart"></div>`;
    }

    createListWidget(widget) {
        if (!widget.data || widget.data.length === 0) {
            return '<div class="empty-state">📅 Nenhuma consulta agendada para hoje</div>';
        }

        const items = widget.data.map(item => `
            <div class="list-item">
                <div class="item-content">${item.content}</div>
                <div class="item-actions">${item.actions || ''}</div>
            </div>
        `).join('');

        return `<div class="widget-list">${items}</div>`;
    }

    createAlertsWidget(widget) {
        const alerts = widget.data.map(alert => `
            <div class="alert-item alert-${alert.type}">
                <span class="alert-icon">${alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span class="alert-message">${alert.message}</span>
            </div>
        `).join('');

        return `<div class="alerts-list">${alerts}</div>`;
    }

    attachEventListeners() {
        // Refresh widgets
        document.querySelectorAll('.widget-refresh').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const widgetId = e.target.dataset.widget;
                this.refreshWidget(widgetId);
            });
        });

        // Widget settings
        document.querySelectorAll('.widget-settings').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const widgetId = e.target.dataset.widget;
                this.showWidgetSettings(widgetId);
            });
        });
    }

    refreshWidget(widgetId) {
        showAlert({
            type: 'info',
            message: `Atualizando ${widgetId}...`,
            timeout: 2000
        });

        // Simular carregamento de dados
        setTimeout(() => {
            showAlert({
                type: 'success',
                message: 'Widget atualizado com sucesso!',
                timeout: 3000
            });
        }, 1000);

        window.trackEvent('widget_refreshed', { widgetId });
    }

    showWidgetSettings(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        
        showModal({
            title: `Configurações - ${widget.title}`,
            content: `
                <div class="widget-settings-form">
                    <div class="form-group">
                        <label>Tamanho do Widget:</label>
                        <select id="widget-size">
                            <option value="small" ${widget.size === 'small' ? 'selected' : ''}>Pequeno</option>
                            <option value="medium" ${widget.size === 'medium' ? 'selected' : ''}>Médio</option>
                            <option value="large" ${widget.size === 'large' ? 'selected' : ''}>Grande</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" ${widget.refresh ? 'checked' : ''}> 
                            Permitir atualização
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button onclick="saveWidgetSettings('${widgetId}')" class="btn-primary">Salvar</button>
                        <button onclick="closeModal()" class="btn-secondary">Cancelar</button>
                    </div>
                </div>
            `,
            size: 'small'
        });
    }
}

// 🔔 Notification Center
class NotificationCenter {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
    }

    init() {
        this.createNotificationBell();
        this.loadNotifications();
    }

    createNotificationBell() {
        const bell = document.createElement('div');
        bell.className = 'notification-bell';
        bell.innerHTML = `
            <button class="notification-btn">
                🔔
                <span class="notification-count" style="display: none;">0</span>
            </button>
        `;

        // Adicionar ao header
        const header = document.querySelector('.admin-header .admin-actions, .header .actions');
        if (header) {
            header.appendChild(bell);
        }

        bell.addEventListener('click', () => this.showNotificationPanel());
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            ...notification,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.unreadCount++;
        this.updateBell();

        // Mostrar alerta para notificações importantes
        if (notification.priority === 'high') {
            showAlert({
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                timeout: 8000
            });
        }

        window.trackEvent('notification_received', {
            type: notification.type,
            priority: notification.priority
        });
    }

    updateBell() {
        const countElement = document.querySelector('.notification-count');
        if (countElement) {
            countElement.textContent = this.unreadCount;
            countElement.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }

    showNotificationPanel() {
        const notificationsList = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-header">
                    <span class="notification-title">${notification.title}</span>
                    <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${notification.action ? `<button class="notification-action" onclick="${notification.action}">${notification.actionLabel || 'Ver'}</button>` : ''}
            </div>
        `).join('');

        showModal({
            title: `Notificações (${this.unreadCount} não lidas)`,
            content: `
                <div class="notifications-panel">
                    <div class="notifications-actions">
                        <button onclick="markAllAsRead()" class="btn-secondary">Marcar todas como lidas</button>
                        <button onclick="clearAllNotifications()" class="btn-danger">Limpar todas</button>
                    </div>
                    <div class="notifications-list">
                        ${notificationsList || '<div class="empty-state">📭 Nenhuma notificação</div>'}
                    </div>
                </div>
            `,
            size: 'medium'
        });

        // Marcar como lidas ao abrir
        this.markAllAsRead();
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.updateBell();
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return timestamp.toLocaleDateString();
    }

    loadNotifications() {
        // Simular carregamento de notificações
        setTimeout(() => {
            this.addNotification({
                type: 'info',
                title: 'Sistema Atualizado',
                message: 'Nova versão do portal foi instalada com sucesso.',
                priority: 'low'
            });

            this.addNotification({
                type: 'warning',
                title: 'Consultas Pendentes',
                message: '3 consultas aguardando confirmação para amanhã.',
                priority: 'high',
                action: 'viewPendingAppointments()',
                actionLabel: 'Ver Consultas'
            });
        }, 2000);
    }
}

// 📅 Appointment Manager Avançado
class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.calendar = null;
    }

    init(container) {
        this.createAppointmentInterface(container);
        this.loadAppointments();
    }

    createAppointmentInterface(container) {
        const interfaceElement = document.createElement('div');
        interfaceElement.className = 'appointment-manager';
        interfaceElement.innerHTML = `
            <div class="appointment-controls">
                <button onclick="showNewAppointmentModal()" class="btn-primary">
                    ➕ Nova Consulta
                </button>
                <button onclick="showCalendarView()" class="btn-secondary">
                    📅 Visualização Calendário
                </button>
                <button onclick="exportAppointments()" class="btn-secondary">
                    📊 Exportar
                </button>
            </div>
            <div id="appointments-container"></div>
        `;

        container.appendChild(interfaceElement);
        this.setupCalendar();
    }

    setupCalendar() {
        const calendar = createCalendar({
            container: '#appointments-container',
            events: this.appointments,
            onDateSelect: (date) => this.showDaySchedule(date),
            onEventClick: (event) => this.showAppointmentDetails(event)
        });

        calendar.mount();
        this.calendar = calendar;
    }

    showNewAppointmentModal() {
        showModal({
            title: '📅 Nova Consulta',
            content: `
                <form id="new-appointment-form" class="appointment-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Paciente:</label>
                            <input type="text" id="patient-name" required placeholder="Nome do paciente">
                        </div>
                        <div class="form-group">
                            <label>Data:</label>
                            <input type="date" id="appointment-date" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Horário:</label>
                            <select id="appointment-time" required>
                                <option value="">Selecionar horário</option>
                                ${this.generateTimeOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Consulta:</label>
                            <select id="appointment-type" required>
                                <option value="consulta">Consulta</option>
                                <option value="retorno">Retorno</option>
                                <option value="cirurgia">Cirurgia</option>
                                <option value="emergencia">Emergência</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observações:</label>
                        <textarea id="appointment-notes" placeholder="Observações adicionais..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Agendar Consulta</button>
                        <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
                    </div>
                </form>
            `,
            size: 'large'
        });

        // Event listener para o formulário
        setTimeout(() => {
            document.getElementById('new-appointment-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAppointment();
            });
        }, 100);
    }

    generateTimeOptions() {
        const times = [];
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                times.push(`<option value="${time}">${time}</option>`);
            }
        }
        return times.join('');
    }

    createAppointment() {
        const formData = {
            patientName: document.getElementById('patient-name').value,
            date: document.getElementById('appointment-date').value,
            time: document.getElementById('appointment-time').value,
            type: document.getElementById('appointment-type').value,
            notes: document.getElementById('appointment-notes').value
        };

        // Validação
        if (!formData.patientName || !formData.date || !formData.time) {
            showAlert({
                type: 'error',
                message: 'Por favor, preencha todos os campos obrigatórios.',
                timeout: 5000
            });
            return;
        }

        // Criar consulta
        const appointment = {
            id: Date.now(),
            ...formData,
            status: 'agendada',
            createdAt: new Date()
        };

        this.appointments.push(appointment);
        this.calendar.addEvent({
            id: appointment.id,
            date: appointment.date,
            title: `${appointment.type} - ${appointment.patientName}`,
            time: appointment.time
        });

        // Fechar modal e mostrar confirmação
        const modal = document.querySelector('.portal-modal-overlay');
        if (modal) modal.remove();

        showAlert({
            type: 'success',
            title: 'Consulta Agendada!',
            message: `Consulta de ${formData.patientName} agendada para ${formData.date} às ${formData.time}`,
            timeout: 5000,
            actions: [
                {
                    id: 'send-confirmation',
                    label: 'Enviar Confirmação',
                    callback: () => this.sendAppointmentConfirmation(appointment)
                }
            ]
        });

        window.trackEvent('appointment_created', {
            type: appointment.type,
            date: appointment.date
        });
    }

    sendAppointmentConfirmation(appointment) {
        // WhatsApp confirmation
        sendWhatsApp({
            phone: '5511999999999', // Número do paciente
            message: {
                patientName: appointment.patientName,
                date: appointment.date,
                time: appointment.time,
                doctorName: 'Marcio Scartozzoni'
            },
            template: 'appointment_reminder'
        });

        showAlert({
            type: 'success',
            message: 'Confirmação enviada via WhatsApp!',
            timeout: 3000
        });
    }

    loadAppointments() {
        // Simular carregamento de consultas
        setTimeout(() => {
            const sampleAppointments = [
                {
                    id: 1,
                    date: '2025-08-11',
                    title: 'Consulta - João Silva',
                    time: '14:00',
                    patientName: 'João Silva',
                    type: 'consulta',
                    status: 'confirmada'
                },
                {
                    id: 2,
                    date: '2025-08-11',
                    title: 'Retorno - Maria Santos',
                    time: '15:30',
                    patientName: 'Maria Santos',
                    type: 'retorno',
                    status: 'agendada'
                }
            ];

            this.appointments = sampleAppointments;
            if (this.calendar) {
                sampleAppointments.forEach(apt => {
                    this.calendar.addEvent(apt);
                });
            }
        }, 1000);
    }
}

// 🌟 Inicializar Sistema de Funcionalidades Profissionais
window.PortalProfessionalFeatures = new PortalProfessionalFeatures();

// 🎯 Funções globais para uso fácil
window.initDashboard = (container) => {
    const dashboardWidgets = window.PortalProfessionalFeatures.getFeature('dashboard-widgets');
    dashboardWidgets.init(container);
};

window.initNotifications = () => {
    const notificationCenter = window.PortalProfessionalFeatures.getFeature('notification-center');
    notificationCenter.init();
};

window.initAppointmentManager = (container) => {
    const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
    appointmentManager.init(container);
};

// Funções auxiliares globais
window.showNewAppointmentModal = () => {
    const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
    appointmentManager.showNewAppointmentModal();
};

window.markAllAsRead = () => {
    const notificationCenter = window.PortalProfessionalFeatures.getFeature('notification-center');
    notificationCenter.markAllAsRead();
};

window.saveWidgetSettings = (widgetId) => {
    showAlert({
        type: 'success',
        message: 'Configurações salvas com sucesso!',
        timeout: 3000
    });
    
    const modal = document.querySelector('.portal-modal-overlay');
    if (modal) modal.remove();
};

// Funções globais adicionais referenciadas por onclick nos templates
window.clearAllNotifications = () => {
    const notificationCenter = window.PortalProfessionalFeatures.getFeature('notification-center');
    if (!notificationCenter) return;
    notificationCenter.notifications = [];
    notificationCenter.unreadCount = 0;
    notificationCenter.updateBell();

    const modal = document.querySelector('.portal-modal-overlay');
    if (modal) modal.remove();

    if (typeof showAlert === 'function') {
        showAlert({ type: 'success', message: 'Notificações limpas.', timeout: 2500 });
    }
};

window.viewPendingAppointments = () => {
    const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
    if (!appointmentManager) return;
    const pending = (appointmentManager.appointments || []).filter(a => a.status !== 'confirmada');
    const count = pending.length;
    if (typeof showAlert === 'function') {
        showAlert({
            type: count ? 'info' : 'success',
            message: count ? `${count} consulta(s) pendente(s) para revisar.` : 'Sem consultas pendentes no momento.',
            timeout: 4000
        });
    }
};

window.showCalendarView = () => {
    const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
    if (!appointmentManager) return;
    const el = document.querySelector('#appointments-container');
    if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (typeof showAlert === 'function') {
        showAlert({ type: 'info', message: 'Visualização de calendário ativa.', timeout: 2000 });
    }
};

window.exportAppointments = () => {
    const appointmentManager = window.PortalProfessionalFeatures.getFeature('appointment-manager');
    if (!appointmentManager) return;
    const rows = [
        ['ID', 'Paciente', 'Data', 'Hora', 'Tipo', 'Status'],
        ...(appointmentManager.appointments || []).map(a => [
            a.id, a.patientName, a.date, a.time, a.type, a.status
        ])
    ];
    const csv = rows.map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultas-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof showAlert === 'function') {
        showAlert({ type: 'success', message: 'Exportação de consultas concluída.', timeout: 3000 });
    }
};
