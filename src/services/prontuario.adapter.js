// src/services/prontuario.adapter.js
/**
 * Adapter for normalizing prontuário data from database to frontend format
 * Handles camelCase conversion and sensitive data masking
 */

/**
 * Mask CPF - shows only last 4 digits
 * @param {string} cpf - CPF to mask
 * @returns {string} Masked CPF
 */
function maskCPF(cpf) {
  if (!cpf) return null;
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `***.***.***-${cleaned.slice(-2)}`;
}

/**
 * Mask email - shows only first 2 chars and domain
 * @param {string} email - Email to mask
 * @returns {string} Masked email
 */
function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Mask phone - shows only last 4 digits
 * @param {string} phone - Phone to mask
 * @returns {string} Masked phone
 */
function maskPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return `***-***-${cleaned.slice(-4)}`;
}

/**
 * Convert snake_case object keys to camelCase
 * @param {Object} obj - Object to convert
 * @returns {Object} Object with camelCase keys
 */
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    }
  }
  return result;
}

/**
 * Adapt prontuário meta data
 * @param {Object} prontuario - Prontuário database row
 * @returns {Object} Adapted prontuário meta
 */
function adaptProntuarioMeta(prontuario) {
  if (!prontuario) return null;

  return {
    id: prontuario.id,
    numeroProntuario: prontuario.numero_prontuario,
    dataCriacao: prontuario.criado_em,
    ativo: prontuario.ativo,
    observacoes: prontuario.observacoes
  };
}

/**
 * Adapt patient data with optional sensitive data masking
 * @param {Object} paciente - Patient database row
 * @param {boolean} showSensitive - Whether to show sensitive data
 * @returns {Object} Adapted patient data
 */
function adaptPaciente(paciente, showSensitive = false) {
  if (!paciente) return null;

  return {
    id: paciente.id,
    nomeCompleto: paciente.nome_completo || paciente.nome,
    cpf: showSensitive ? paciente.cpf : maskCPF(paciente.cpf),
    telefone: showSensitive ? paciente.telefone : maskPhone(paciente.telefone),
    email: showSensitive ? paciente.email : maskEmail(paciente.email),
    dataNascimento: paciente.data_nascimento
  };
}

/**
 * Adapt ficha atendimento data
 * @param {Object} ficha - Ficha database row
 * @returns {Object} Adapted ficha data
 */
function adaptFichaAtendimento(ficha) {
  if (!ficha) return null;

  return {
    id: ficha.id,
    prontuarioId: ficha.prontuario_id,
    agendamentoId: ficha.agendamento_id,
    dataConsulta: ficha.data_consulta,
    anamnese: ficha.anamnese,
    exameFisico: ficha.exame_fisico,
    diagnostico: ficha.diagnostico,
    tratamento: ficha.tratamento,
    prescricao: ficha.prescricao,
    examesSolicitados: ficha.exames_solicitados,
    observacoes: ficha.observacoes,
    criadoEm: ficha.criado_em,
    atualizadoEm: ficha.atualizado_em
  };
}

/**
 * Adapt orcamento data
 * @param {Object} orcamento - Orcamento database row
 * @returns {Object} Adapted orcamento data
 */
function adaptOrcamento(orcamento) {
  if (!orcamento) return null;

  return {
    id: orcamento.id,
    protocolo: orcamento.protocolo,
    valorTotal: parseFloat(orcamento.valor_total),
    descricaoProcedimento: orcamento.descricao_procedimento,
    status: orcamento.status,
    dataValidade: orcamento.data_validade,
    criadoEm: orcamento.criado_em,
    atualizadoEm: orcamento.atualizado_em
  };
}

/**
 * Adapt exame data
 * @param {Object} exame - Exame database row
 * @returns {Object} Adapted exame data
 */
function adaptExame(exame) {
  if (!exame) return null;

  return {
    id: exame.id,
    prontuarioId: exame.prontuario_id,
    nomeExame: exame.nome_exame,
    tipoExame: exame.tipo_exame,
    laboratorio: exame.laboratorio,
    dataSolicitacao: exame.data_solicitacao,
    dataRealizacao: exame.data_realizacao,
    dataResultado: exame.data_resultado,
    status: exame.status,
    criadoEm: exame.criado_em,
    atualizadoEm: exame.atualizado_em
  };
}

/**
 * Adapt agendamento data
 * @param {Object} agendamento - Agendamento database row
 * @returns {Object} Adapted agendamento data
 */
function adaptAgendamento(agendamento) {
  if (!agendamento) return null;

  return {
    id: agendamento.id,
    pacienteId: agendamento.paciente_id,
    dataHora: agendamento.data_hora,
    tipoConsulta: agendamento.tipo_consulta,
    status: agendamento.status,
    motivoConsulta: agendamento.motivo_consulta,
    observacoes: agendamento.observacoes,
    criadoEm: agendamento.criado_em,
    atualizadoEm: agendamento.atualizado_em
  };
}

/**
 * Adapt complete prontuário response
 * @param {Object} data - Complete prontuário data from service
 * @param {boolean} showSensitive - Whether to show sensitive data
 * @returns {Object} Adapted complete response
 */
function adaptProntuarioCompleto(data, showSensitive = false) {
  return {
    prontuario: adaptProntuarioMeta(data.prontuario),
    paciente: adaptPaciente(data.paciente, showSensitive),
    fichasAtendimento: (data.fichasAtendimento || []).map(adaptFichaAtendimento),
    orcamentos: (data.orcamentos || []).map(adaptOrcamento),
    exames: (data.exames || []).map(adaptExame),
    agendamentos: (data.agendamentos || []).map(adaptAgendamento),
    pagination: {
      fichas: data.pagination?.fichas || { hasNext: false },
      orcamentos: data.pagination?.orcamentos || { hasNext: false },
      exames: data.pagination?.exames || { hasNext: false },
      agendamentos: data.pagination?.agendamentos || { hasNext: false }
    }
  };
}

module.exports = {
  adaptProntuarioCompleto,
  adaptProntuarioMeta,
  adaptPaciente,
  adaptFichaAtendimento,
  adaptOrcamento,
  adaptExame,
  adaptAgendamento,
  maskCPF,
  maskEmail,
  maskPhone,
  toCamelCase
};
