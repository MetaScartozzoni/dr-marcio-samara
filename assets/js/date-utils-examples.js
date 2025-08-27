// 📅 Exemplos de uso da Edge Function Date Utils
// Este arquivo demonstra como usar todas as funcionalidades da função date-utils

// =====================================================
// 1. FORMATAÇÃO DE DATAS
// =====================================================

/**
 * Exemplos de formatação de datas
 */
async function exemplosFormatacao() {
  console.log('=== EXEMPLOS DE FORMATAÇÃO ===');

  const dataTeste = '2024-08-27T10:30:00Z';

  try {
    // Formato brasileiro
    const formatoBR = await window.DateUtilsClient.format(dataTeste, 'DD/MM/YYYY');
    console.log('Formato BR:', formatoBR); // "27/08/2024"

    // Com hora
    const comHora = await window.DateUtilsClient.format(dataTeste, 'DD/MM/YYYY HH:mm');
    console.log('Com hora:', comHora); // "27/08/2024 10:30"

    // Com segundos
    const comSegundos = await window.DateUtilsClient.format(dataTeste, 'DD/MM/YYYY HH:mm:ss');
    console.log('Com segundos:', comSegundos); // "27/08/2024 10:30:00"

    // Formato americano
    const formatoUS = await window.DateUtilsClient.format(dataTeste, 'YYYY-MM-DD');
    console.log('Formato US:', formatoUS); // "2024-08-27"

    // Com dia da semana
    const comDiaSemana = await window.DateUtilsClient.format(dataTeste, 'EEEE, DD/MM/YYYY');
    console.log('Com dia da semana:', comDiaSemana); // "terça-feira, 27/08/2024"

  } catch (error) {
    console.error('Erro na formatação:', error);
  }
}

// =====================================================
// 2. PARSE DE DATAS
// =====================================================

/**
 * Exemplos de parse de strings para datas
 */
async function exemplosParse() {
  console.log('=== EXEMPLOS DE PARSE ===');

  try {
    // Parse formato brasileiro
    const parseBR = await window.DateUtilsClient.parse('27/08/2024', 'DD/MM/YYYY');
    console.log('Parse BR:', parseBR);
    /*
    {
      date: "2024-08-27T00:00:00.000Z",
      timestamp: 1724716800000,
      day: 27,
      month: 8,
      year: 2024,
      weekday: 2,
      weekdayName: "terça-feira"
    }
    */

    // Parse formato americano
    const parseUS = await window.DateUtilsClient.parse('08/27/2024', 'MM/DD/YYYY');
    console.log('Parse US:', parseUS);

    // Parse ISO string
    const parseISO = await window.DateUtilsClient.parse('2024-08-27T10:30:00Z');
    console.log('Parse ISO:', parseISO);

  } catch (error) {
    console.error('Erro no parse:', error);
  }
}

// =====================================================
// 3. ADICIONAR PERÍODO À DATA
// =====================================================

/**
 * Exemplos de adição de períodos a datas
 */
async function exemplosAdicao() {
  console.log('=== EXEMPLOS DE ADIÇÃO ===');

  const dataBase = '2024-08-27T10:30:00Z';

  try {
    // Adicionar 7 dias
    const adicionarDias = await window.DateUtilsClient.add(dataBase, 7, 'days');
    console.log('Adicionar 7 dias:', adicionarDias);
    /*
    {
      original: "2024-08-27T10:30:00.000Z",
      result: "2024-09-03T10:30:00.000Z",
      formatted: "03/09/2024 10:30"
    }
    */

    // Adicionar 2 semanas
    const adicionarSemanas = await window.DateUtilsClient.add(dataBase, 2, 'weeks');
    console.log('Adicionar 2 semanas:', adicionarSemanas);

    // Adicionar 1 mês
    const adicionarMes = await window.DateUtilsClient.add(dataBase, 1, 'months');
    console.log('Adicionar 1 mês:', adicionarMes);

    // Adicionar 30 minutos
    const adicionarMinutos = await window.DateUtilsClient.add(dataBase, 30, 'minutes');
    console.log('Adicionar 30 minutos:', adicionarMinutos);

  } catch (error) {
    console.error('Erro na adição:', error);
  }
}

// =====================================================
// 4. DIFERENÇA ENTRE DATAS
// =====================================================

/**
 * Exemplos de cálculo de diferença entre datas
 */
async function exemplosDiferenca() {
  console.log('=== EXEMPLOS DE DIFERENÇA ===');

  const dataInicio = '2024-08-27T10:30:00Z';
  const dataFim = '2024-09-03T15:45:00Z';

  try {
    // Diferença em dias
    const diffDias = await window.DateUtilsClient.diff(dataInicio, dataFim, 'days');
    console.log('Diferença em dias:', diffDias);
    /*
    {
      start: "2024-08-27T10:30:00.000Z",
      end: "2024-09-03T15:45:00.000Z",
      difference: 7,
      unit: "days",
      absolute: 7,
      direction: "future"
    }
    */

    // Diferença em horas
    const diffHoras = await window.DateUtilsClient.diff(dataInicio, dataFim, 'hours');
    console.log('Diferença em horas:', diffHoras);

    // Diferença em minutos
    const diffMinutos = await window.DateUtilsClient.diff(dataInicio, dataFim, 'minutes');
    console.log('Diferença em minutos:', diffMinutos);

  } catch (error) {
    console.error('Erro na diferença:', error);
  }
}

// =====================================================
// 5. VALIDAÇÃO DE DATAS
// =====================================================

/**
 * Exemplos de validação de datas
 */
async function exemplosValidacao() {
  console.log('=== EXEMPLOS DE VALIDAÇÃO ===');

  const datasParaTestar = [
    '2024-08-27',
    '27/08/2024',
    '2024-02-30', // Data inválida
    '31/02/2024', // Data inválida
    'abc/def/ghi' // Formato inválido
  ];

  for (const data of datasParaTestar) {
    try {
      const validacao = await window.DateUtilsClient.isValid(data);
      console.log(`Validação de "${data}":`, validacao);
      /*
      {
        valid: true,
        date: "2024-08-27T00:00:00.000Z",
        formatted: "27/08/2024"
      }
      ou
      {
        valid: false,
        reason: "Formato de data inválido"
      }
      */
    } catch (error) {
      console.error(`Erro ao validar "${data}":`, error);
    }
  }
}

// =====================================================
// 6. DIAS ÚTEIS
// =====================================================

/**
 * Exemplos de cálculo de dias úteis
 */
async function exemplosDiasUteis() {
  console.log('=== EXEMPLOS DE DIAS ÚTEIS ===');

  const inicio = '2024-08-26'; // Segunda-feira
  const fim = '2024-09-01'; // Domingo

  try {
    // Apenas dias úteis (segunda a sexta)
    const diasUteis = await window.DateUtilsClient.businessDays(inicio, fim, false);
    console.log('Dias úteis:', diasUteis);
    /*
    {
      start: "2024-08-26T00:00:00.000Z",
      end: "2024-09-01T00:00:00.000Z",
      businessDays: 5,
      totalDays: 7,
      includeWeekends: false
    }
    */

    // Incluindo finais de semana
    const todosDias = await window.DateUtilsClient.businessDays(inicio, fim, true);
    console.log('Todos os dias:', todosDias);

  } catch (error) {
    console.error('Erro nos dias úteis:', error);
  }
}

// =====================================================
// 7. CÁLCULO DE IDADE
// =====================================================

/**
 * Exemplos de cálculo de idade
 */
async function exemplosIdade() {
  console.log('=== EXEMPLOS DE IDADE ===');

  const dataNascimento = '1990-05-15';

  try {
    // Idade atual
    const idadeAtual = await window.DateUtilsClient.age(dataNascimento);
    console.log('Idade atual:', idadeAtual);
    /*
    {
      birthDate: "1990-05-15T00:00:00.000Z",
      referenceDate: "2024-08-27T...",
      age: 34,
      years: 34,
      months: 408,
      days: 12547
    }
    */

    // Idade em uma data específica
    const idadeEspecifica = await window.DateUtilsClient.age(dataNascimento, '2020-05-15');
    console.log('Idade em 15/05/2020:', idadeEspecifica);

  } catch (error) {
    console.error('Erro no cálculo de idade:', error);
  }
}

// =====================================================
// 8. HORÁRIO COMERCIAL
// =====================================================

/**
 * Exemplos de verificação de horário comercial
 */
async function exemplosHorarioComercial() {
  console.log('=== EXEMPLOS DE HORÁRIO COMERCIAL ===');

  try {
    // Verificar horário atual
    const horarioAtual = await window.DateUtilsClient.workingHours();
    console.log('Horário atual:', horarioAtual);
    /*
    {
      date: "2024-08-27T10:30:00.000Z",
      isWorking: true,
      isWorkDay: true,
      isWorkHour: true,
      dayOfWeek: 2,
      dayName: "terça-feira",
      hour: 10,
      workDays: [1, 2, 3, 4, 5],
      workHours: "8:00 - 18:00"
    }
    */

    // Verificar horário específico
    const horarioEspecifico = await window.DateUtilsClient.workingHours('2024-08-27T20:30:00Z');
    console.log('Horário específico (20:30):', horarioEspecifico);

    // Com horário comercial personalizado
    const horarioPersonalizado = await window.DateUtilsClient.workingHours(null, {
      startHour: 9,
      endHour: 17,
      workDays: [1, 2, 3, 4, 5, 6] // Incluindo sábado
    });
    console.log('Horário personalizado:', horarioPersonalizado);

  } catch (error) {
    console.error('Erro no horário comercial:', error);
  }
}

// =====================================================
// 9. CONVERSÃO DE TIMEZONE
// =====================================================

/**
 * Exemplos de conversão de timezone
 */
async function exemplosTimezone() {
  console.log('=== EXEMPLOS DE TIMEZONE ===');

  const dataTeste = '2024-08-27T10:30:00Z';

  try {
    const conversao = await window.DateUtilsClient.timezone(dataTeste);
    console.log('Conversão de timezone:', conversao);
    /*
    {
      original: "2024-08-27T10:30:00.000Z",
      local: "27/08/2024 07:30:00",
      utc: "Tue, 27 Aug 2024 10:30:00 GMT",
      timestamp: 1724752200000,
      note: "Para conversões de timezone completas, considere usar uma biblioteca especializada"
    }
    */

  } catch (error) {
    console.error('Erro na conversão de timezone:', error);
  }
}

// =====================================================
// FUNÇÃO PARA EXECUTAR TODOS OS EXEMPLOS
// =====================================================

/**
 * Executa todos os exemplos
 */
async function executarTodosExemplos() {
  console.log('🚀 Iniciando exemplos da função date-utils...\n');

  await exemplosFormatacao();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosParse();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosAdicao();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosDiferenca();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosValidacao();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosDiasUteis();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosIdade();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosHorarioComercial();
  console.log('\n' + '='.repeat(50) + '\n');

  await exemplosTimezone();

  console.log('\n✅ Todos os exemplos foram executados!');
}

// =====================================================
// EXEMPLO DE USO PRÁTICO NO SISTEMA
// =====================================================

/**
 * Exemplos práticos de uso no sistema médico
 */
async function exemplosPraticos() {
  console.log('=== EXEMPLOS PRÁTICOS ===');

  try {
    // 1. Calcular idade do paciente
    const idadePaciente = await window.DateUtilsClient.age('1990-05-15');
    console.log(`Idade do paciente: ${idadePaciente.age} anos`);

    // 2. Formatar data de consulta
    const dataConsulta = await window.DateUtilsClient.format('2024-09-15T14:30:00Z', 'DD/MM/YYYY HH:mm');
    console.log(`Data da consulta: ${dataConsulta}`);

    // 3. Calcular dias úteis para agendamento
    const disponibilidade = await window.DateUtilsClient.businessDays('2024-08-27', '2024-09-10');
    console.log(`Dias úteis disponíveis: ${disponibilidade.businessDays}`);

    // 4. Verificar se está no horário comercial
    const horarioComercial = await window.DateUtilsClient.workingHours();
    console.log(`Está no horário comercial: ${horarioComercial.isWorking ? 'Sim' : 'Não'}`);

    // 5. Calcular validade de orçamento (30 dias)
    const validadeOrcamento = await window.DateUtilsClient.add('2024-08-27', 30, 'days');
    console.log(`Validade do orçamento: ${validadeOrcamento.formatted}`);

  } catch (error) {
    console.error('Erro nos exemplos práticos:', error);
  }
}

// Exportar funções para uso global
window.DateUtilsExamples = {
  executarTodosExemplos,
  exemplosPraticos,
  exemplosFormatacao,
  exemplosParse,
  exemplosAdicao,
  exemplosDiferenca,
  exemplosValidacao,
  exemplosDiasUteis,
  exemplosIdade,
  exemplosHorarioComercial,
  exemplosTimezone
};
