// 🎨 Portal UI Components - Sistema de Componentes Reutilizáveis v20250811-1700
class PortalComponents {
    constructor() {
        this.components = new Map();
        this.init();
    }

    init() {
        this.registerComponent('modal', ModalComponent);
        this.registerComponent('alert', AlertComponent);
        this.registerComponent('card', CardComponent);
        this.registerComponent('calendar', CalendarComponent);
        this.registerComponent('chart', ChartComponent);
    }

    registerComponent(name, componentClass) {
        this.components.set(name, componentClass);
    }

    create(componentName, options = {}) {
        const ComponentClass = this.components.get(componentName);
        if (!ComponentClass) {
            throw new Error(`Componente ${componentName} não encontrado`);
        }
        return new ComponentClass(options);
    }
}

// 🪟 Modal Component
class ModalComponent {
    constructor({ title, content, size = 'medium', closable = true }) {
        this.title = title;
        this.content = content;
        this.size = size;
        this.closable = closable;
        this.isOpen = false;
    }

    render() {
        const sizeClass = this.getSizeClass();
        
        return `
            <div class="portal-modal-overlay" style="display: none;">
                <div class="portal-modal ${sizeClass}">
                    <div class="portal-modal-header">
                        <h3>${this.title}</h3>
                        ${this.closable ? '<button class="portal-modal-close">&times;</button>' : ''}
                    </div>
                    <div class="portal-modal-body">
                        ${this.content}
                    </div>
                </div>
            </div>
        `;
    }

    getSizeClass() {
        const sizes = {
            small: 'portal-modal-sm',
            medium: 'portal-modal-md',
            large: 'portal-modal-lg',
            xlarge: 'portal-modal-xl'
        };
        return sizes[this.size] || sizes.medium;
    }

    open() {
        document.body.insertAdjacentHTML('beforeend', this.render());
        const overlay = document.querySelector('.portal-modal-overlay:last-child');
        const closeBtn = overlay.querySelector('.portal-modal-close');
        
        overlay.style.display = 'flex';
        this.isOpen = true;

        // Event listeners
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Analytics
        window.trackEvent('modal_opened', { title: this.title, size: this.size });
    }

    close() {
        const overlay = document.querySelector('.portal-modal-overlay:last-child');
        if (overlay) {
            overlay.remove();
            this.isOpen = false;
            window.trackEvent('modal_closed', { title: this.title });
        }
    }
}

// 🚨 Alert Component
class AlertComponent {
    constructor({ type = 'info', title, message, timeout = 5000, actions = [] }) {
        this.type = type;
        this.title = title;
        this.message = message;
        this.timeout = timeout;
        this.actions = actions;
        this.id = 'alert-' + Date.now();
    }

    render() {
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const actionsHtml = this.actions.map(action => 
            `<button class="portal-alert-action" data-action="${action.id}">${action.label}</button>`
        ).join('');

        return `
            <div class="portal-alert portal-alert-${this.type}" id="${this.id}">
                <div class="portal-alert-icon">${iconMap[this.type]}</div>
                <div class="portal-alert-content">
                    ${this.title ? `<div class="portal-alert-title">${this.title}</div>` : ''}
                    <div class="portal-alert-message">${this.message}</div>
                    ${actionsHtml ? `<div class="portal-alert-actions">${actionsHtml}</div>` : ''}
                </div>
                <button class="portal-alert-close">&times;</button>
            </div>
        `;
    }

    show() {
        // Container para alerts
        let container = document.querySelector('.portal-alerts-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'portal-alerts-container';
            document.body.appendChild(container);
        }

        container.insertAdjacentHTML('afterbegin', this.render());
        const alertElement = document.getElementById(this.id);

        // Event listeners
        alertElement.querySelector('.portal-alert-close').addEventListener('click', () => {
            this.close();
        });

        // Action buttons
        this.actions.forEach(action => {
            const btn = alertElement.querySelector(`[data-action="${action.id}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    action.callback();
                    if (action.closeOnClick !== false) this.close();
                });
            }
        });

        // Auto close
        if (this.timeout > 0) {
            setTimeout(() => this.close(), this.timeout);
        }

        // Analytics
        window.trackEvent('alert_shown', { type: this.type, title: this.title });
    }

    close() {
        const alertElement = document.getElementById(this.id);
        if (alertElement) {
            alertElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alertElement.remove(), 300);
        }
    }
}

// 📋 Card Component
class CardComponent {
    constructor({ title, content, footer, actions = [], className = '' }) {
        this.title = title;
        this.content = content;
        this.footer = footer;
        this.actions = actions;
        this.className = className;
    }

    render() {
        const actionsHtml = this.actions.map(action => 
            `<button class="portal-card-action btn-${action.type || 'primary'}" data-action="${action.id}">${action.label}</button>`
        ).join('');

        return `
            <div class="portal-card ${this.className}">
                ${this.title ? `<div class="portal-card-header"><h4>${this.title}</h4></div>` : ''}
                <div class="portal-card-body">${this.content}</div>
                ${this.footer || actionsHtml ? `
                    <div class="portal-card-footer">
                        ${this.footer || ''}
                        ${actionsHtml ? `<div class="portal-card-actions">${actionsHtml}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    mount(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        container.insertAdjacentHTML('beforeend', this.render());
        
        // Event listeners para actions
        this.actions.forEach(action => {
            const btn = container.querySelector(`[data-action="${action.id}"]`);
            if (btn) {
                btn.addEventListener('click', action.callback);
            }
        });
    }
}

// 📊 Chart Component (usando Chart.js)
class ChartComponent {
    constructor({ type, data, options = {}, container }) {
        this.type = type;
        this.data = data;
        this.options = options;
        this.container = container;
        this.chartInstance = null;
    }

    render() {
        const canvasId = 'chart-' + Date.now();
        return `<canvas id="${canvasId}" width="400" height="200"></canvas>`;
    }

    async mount() {
        if (typeof this.container === 'string') {
            this.container = document.querySelector(this.container);
        }

        this.container.innerHTML = this.render();
        const canvas = this.container.querySelector('canvas');
        
        // Verificar se Chart.js está carregado
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }

        this.chartInstance = new Chart(canvas, {
            type: this.type,
            data: this.data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                ...this.options
            }
        });

        window.trackEvent('chart_created', { type: this.type, dataPoints: this.data.datasets?.[0]?.data?.length || 0 });
    }

    async loadChartJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    update(newData) {
        if (this.chartInstance) {
            this.chartInstance.data = newData;
            this.chartInstance.update();
        }
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}

// 📅 Calendar Component
class CalendarComponent {
    constructor({ events = [], onEventClick, onDateSelect, container }) {
        this.events = events;
        this.onEventClick = onEventClick;
        this.onDateSelect = onDateSelect;
        this.container = container;
        this.currentDate = new Date();
    }

    render() {
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        let calendarHtml = `
            <div class="portal-calendar">
                <div class="portal-calendar-header">
                    <button class="portal-calendar-nav" data-nav="prev">❮</button>
                    <h3>${monthNames[month]} ${year}</h3>
                    <button class="portal-calendar-nav" data-nav="next">❯</button>
                </div>
                <div class="portal-calendar-grid">
                    <div class="portal-calendar-weekdays">
                        <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                    </div>
                    <div class="portal-calendar-days">
        `;

        // Dias vazios do início
        for (let i = 0; i < firstDay; i++) {
            calendarHtml += '<div class="portal-calendar-day empty"></div>';
        }

        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = this.events.filter(event => event.date === dateStr);
            const hasEvents = dayEvents.length > 0;
            const isToday = this.isToday(date);

            calendarHtml += `
                <div class="portal-calendar-day ${hasEvents ? 'has-events' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}">
                    <span class="day-number">${day}</span>
                    ${hasEvents ? `<div class="event-indicator">${dayEvents.length}</div>` : ''}
                </div>
            `;
        }

        calendarHtml += `
                    </div>
                </div>
            </div>
        `;

        return calendarHtml;
    }

    mount() {
        if (typeof this.container === 'string') {
            this.container = document.querySelector(this.container);
        }

        this.container.innerHTML = this.render();
        this.addEventListeners();
    }

    addEventListeners() {
        // Navigation
        this.container.querySelectorAll('[data-nav]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.target.dataset.nav;
                if (direction === 'prev') {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                } else {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                }
                this.mount();
            });
        });

        // Date selection
        this.container.querySelectorAll('.portal-calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.target.closest('.portal-calendar-day').dataset.date;
                if (this.onDateSelect) {
                    this.onDateSelect(date);
                }
                window.trackEvent('calendar_date_selected', { date });
            });
        });
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    addEvent(event) {
        this.events.push(event);
        this.mount();
    }

    removeEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.mount();
    }
}

// 🌟 Inicializar sistema de componentes
window.PortalComponents = new PortalComponents();

// 🎯 Helpers globais
window.showModal = (options) => {
    const modal = window.PortalComponents.create('modal', options);
    modal.open();
    return modal;
};

window.showAlert = (options) => {
    const alert = window.PortalComponents.create('alert', options);
    alert.show();
    return alert;
};

window.createCard = (options) => {
    return window.PortalComponents.create('card', options);
};

window.createChart = (options) => {
    return window.PortalComponents.create('chart', options);
};

window.createCalendar = (options) => {
    return window.PortalComponents.create('calendar', options);
};
