// Validação específica para formulários médicos
document.addEventListener('DOMContentLoaded', function() {
    // Validar CPF em tempo real
    document.querySelectorAll('input[data-type="cpf"]').forEach(input => {
        input.addEventListener('input', function() {
            const cpf = this.value.replace(/[^\d]/g, '');
            if (cpf.length === 11) {
                if (DataValidator.validateCPF(cpf)) {
                    this.style.borderColor = '#28a745';
                } else {
                    this.style.borderColor = '#dc3545';
                }
            }
        });
    });
    
    // Validar valores monetários
    document.querySelectorAll('input[data-type="currency"]').forEach(input => {
        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (DataValidator.validateCurrency(value)) {
                this.style.borderColor = '#28a745';
            } else {
                this.style.borderColor = '#dc3545';
            }
        });
    });
    
    // Sanitizar campos de texto
    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.addEventListener('blur', function() {
            this.value = DataValidator.sanitizeText(this.value);
        });
    });
});
