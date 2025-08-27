// 📅 Utilitários de Data - Edge Function

/**
 * Edge Function para utilitários de data
 * Fornece funções para manipulação, formatação e cálculos de datas
 */

/**
 * Função principal da Edge Function
 */
export async function handler(req) {
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Método não permitido. Use POST.'
        }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse do corpo da requisição
    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ação não especificada'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let result;

    // Executar ação solicitada
    switch (action) {
      case 'format':
        result = formatDate(data);
        break;

      case 'parse':
        result = parseDate(data);
        break;

      case 'add':
        result = addToDate(data);
        break;

      case 'diff':
        result = dateDiff(data);
        break;

      case 'isValid':
        result = isValidDate(data);
        break;

      case 'businessDays':
        result = calculateBusinessDays(data);
        break;

      case 'age':
        result = calculateAge(data);
        break;

      case 'timezone':
        result = convertTimezone(data);
        break;

      case 'workingHours':
        result = checkWorkingHours(data);
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Ação '${action}' não reconhecida`
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: action,
        result: result
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro na função date-utils:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Formatar data para diferentes formatos
 */
function formatDate(data) {
  const { date, format = 'DD/MM/YYYY', locale = 'pt-BR' } = data;

  if (!date) {
    throw new Error('Data não fornecida');
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Data inválida');
  }

  const options = {
    'DD/MM/YYYY': {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    'YYYY-MM-DD': {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    },
    'DD/MM/YYYY HH:mm': {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    'DD/MM/YYYY HH:mm:ss': {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    },
    'EEEE, DD/MM/YYYY': {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  };

  const formatOptions = options[format];
  if (!formatOptions) {
    throw new Error(`Formato '${format}' não suportado`);
  }

  return dateObj.toLocaleDateString(locale, formatOptions);
}

/**
 * Parse de string para objeto Date
 */
function parseDate(data) {
  const { dateString, format = 'DD/MM/YYYY' } = data;

  if (!dateString) {
    throw new Error('String de data não fornecida');
  }

  let dateObj;

  switch (format) {
    case 'DD/MM/YYYY':
      const [day, month, year] = dateString.split('/');
      dateObj = new Date(year, month - 1, day);
      break;

    case 'YYYY-MM-DD':
      dateObj = new Date(dateString);
      break;

    case 'MM/DD/YYYY':
      const [monthUS, dayUS, yearUS] = dateString.split('/');
      dateObj = new Date(yearUS, monthUS - 1, dayUS);
      break;

    default:
      dateObj = new Date(dateString);
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error('Formato de data inválido');
  }

  return {
    date: dateObj.toISOString(),
    timestamp: dateObj.getTime(),
    day: dateObj.getDate(),
    month: dateObj.getMonth() + 1,
    year: dateObj.getFullYear(),
    weekday: dateObj.getDay(),
    weekdayName: dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
  };
}

/**
 * Adicionar período a uma data
 */
function addToDate(data) {
  const { date, amount, unit = 'days' } = data;

  if (!date || !amount) {
    throw new Error('Data e quantidade não fornecidas');
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Data inválida');
  }

  const units = {
    'milliseconds': amount,
    'seconds': amount * 1000,
    'minutes': amount * 60 * 1000,
    'hours': amount * 60 * 60 * 1000,
    'days': amount * 24 * 60 * 60 * 1000,
    'weeks': amount * 7 * 24 * 60 * 60 * 1000,
    'months': amount * 30 * 24 * 60 * 60 * 1000, // Aproximado
    'years': amount * 365 * 24 * 60 * 60 * 1000 // Aproximado
  };

  const milliseconds = units[unit];
  if (!milliseconds) {
    throw new Error(`Unidade '${unit}' não suportada`);
  }

  const newDate = new Date(dateObj.getTime() + milliseconds);

  return {
    original: dateObj.toISOString(),
    result: newDate.toISOString(),
    formatted: formatDate({ date: newDate, format: 'DD/MM/YYYY HH:mm' })
  };
}

/**
 * Calcular diferença entre datas
 */
function dateDiff(data) {
  const { startDate, endDate, unit = 'days' } = data;

  if (!startDate || !endDate) {
    throw new Error('Datas de início e fim não fornecidas');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Uma ou ambas as datas são inválidas');
  }

  const diffMs = end.getTime() - start.getTime();

  const units = {
    'milliseconds': diffMs,
    'seconds': Math.floor(diffMs / 1000),
    'minutes': Math.floor(diffMs / (1000 * 60)),
    'hours': Math.floor(diffMs / (1000 * 60 * 60)),
    'days': Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    'weeks': Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)),
    'months': Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)), // Aproximado
    'years': Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365)) // Aproximado
  };

  const result = units[unit];
  if (result === undefined) {
    throw new Error(`Unidade '${unit}' não suportada`);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    difference: result,
    unit: unit,
    absolute: Math.abs(result),
    direction: result >= 0 ? 'future' : 'past'
  };
}

/**
 * Verificar se uma data é válida
 */
function isValidDate(data) {
  const { date } = data;

  if (!date) {
    return { valid: false, reason: 'Data não fornecida' };
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { valid: false, reason: 'Formato de data inválido' };
  }

  // Verificações adicionais
  const year = dateObj.getFullYear();
  if (year < 1900 || year > 2100) {
    return { valid: false, reason: 'Ano fora do intervalo válido (1900-2100)' };
  }

  return {
    valid: true,
    date: dateObj.toISOString(),
    formatted: formatDate({ date: dateObj, format: 'DD/MM/YYYY' })
  };
}

/**
 * Calcular dias úteis entre datas
 */
function calculateBusinessDays(data) {
  const { startDate, endDate, includeWeekends = false } = data;

  if (!startDate || !endDate) {
    throw new Error('Datas de início e fim não fornecidas');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Uma ou ambas as datas são inválidas');
  }

  let businessDays = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();

    if (includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      businessDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    businessDays: businessDays,
    totalDays: Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    includeWeekends: includeWeekends
  };
}

/**
 * Calcular idade baseada na data de nascimento
 */
function calculateAge(data) {
  const { birthDate, atDate } = data;

  if (!birthDate) {
    throw new Error('Data de nascimento não fornecida');
  }

  const birth = new Date(birthDate);
  const reference = atDate ? new Date(atDate) : new Date();

  if (isNaN(birth.getTime())) {
    throw new Error('Data de nascimento inválida');
  }

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }

  return {
    birthDate: birth.toISOString(),
    referenceDate: reference.toISOString(),
    age: age,
    years: age,
    months: age * 12,
    days: Math.floor((reference.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Converter timezone
 */
function convertTimezone(data) {
  const { date } = data;

  if (!date) {
    throw new Error('Data não fornecida');
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    throw new Error('Data inválida');
  }

  // Para implementações mais complexas, seria necessário usar uma biblioteca como moment-timezone
  // Por enquanto, retornamos informações básicas
  return {
    original: dateObj.toISOString(),
    local: dateObj.toLocaleString('pt-BR'),
    utc: dateObj.toUTCString(),
    timestamp: dateObj.getTime(),
    note: 'Para conversões de timezone completas, considere usar uma biblioteca especializada'
  };
}

/**
 * Verificar se está dentro do horário comercial
 */
function checkWorkingHours(data) {
  const {
    date,
    startHour = 8,
    endHour = 18,
    workDays = [1, 2, 3, 4, 5] // Segunda a sexta
  } = data;

  const reference = date ? new Date(date) : new Date();
  const dayOfWeek = reference.getDay();
  const hour = reference.getHours();

  const isWorkDay = workDays.includes(dayOfWeek);
  const isWorkHour = hour >= startHour && hour < endHour;
  const isWorking = isWorkDay && isWorkHour;

  return {
    date: reference.toISOString(),
    isWorking: isWorking,
    isWorkDay: isWorkDay,
    isWorkHour: isWorkHour,
    dayOfWeek: dayOfWeek,
    dayName: reference.toLocaleDateString('pt-BR', { weekday: 'long' }),
    hour: hour,
    workDays: workDays,
    workHours: `${startHour}:00 - ${endHour}:00`
  };
}

// Exportar função handler como padrão
export default handler;
