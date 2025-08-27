// 📅 Cliente para Edge Function Date Utils
// Facilita o uso da função date-utils em todo o sistema

class DateUtilsClient {
  constructor() {
    this.baseUrl = window.PORTAL_CONFIG?.EDGE_FUNCTIONS?.DATE_UTILS;
    if (!this.baseUrl) {
      console.warn('URL da função date-utils não configurada');
    }
  }

  /**
   * Executa uma ação na função date-utils
   */
  async execute(action, data = {}) {
    if (!this.baseUrl) {
      throw new Error('URL da função date-utils não configurada');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.PORTAL_CONFIG?.SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          action: action,
          data: data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro na execução da função');
      }

      return result.result;
    } catch (error) {
      console.error('Erro ao executar date-utils:', error);
      throw error;
    }
  }

  /**
   * Formatar data
   */
  async format(date, format = 'DD/MM/YYYY', locale = 'pt-BR') {
    return await this.execute('format', { date, format, locale });
  }

  /**
   * Parse de string para data
   */
  async parse(dateString, format = 'DD/MM/YYYY') {
    return await this.execute('parse', { dateString, format });
  }

  /**
   * Adicionar período a uma data
   */
  async add(date, amount, unit = 'days') {
    return await this.execute('add', { date, amount, unit });
  }

  /**
   * Calcular diferença entre datas
   */
  async diff(startDate, endDate, unit = 'days') {
    return await this.execute('diff', { startDate, endDate, unit });
  }

  /**
   * Verificar se data é válida
   */
  async isValid(date) {
    return await this.execute('isValid', { date });
  }

  /**
   * Calcular dias úteis
   */
  async businessDays(startDate, endDate, includeWeekends = false) {
    return await this.execute('businessDays', { startDate, endDate, includeWeekends });
  }

  /**
   * Calcular idade
   */
  async age(birthDate, atDate = null) {
    return await this.execute('age', { birthDate, atDate });
  }

  /**
   * Converter timezone
   */
  async timezone(date) {
    return await this.execute('timezone', { date });
  }

  /**
   * Verificar horário comercial
   */
  async workingHours(date = null, options = {}) {
    const data = { date, ...options };
    return await this.execute('workingHours', data);
  }
}

// Instância global
window.DateUtilsClient = new DateUtilsClient();

// Exportar para módulos ES6
export default DateUtilsClient;
