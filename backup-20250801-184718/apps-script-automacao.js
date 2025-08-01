// Código para Google Apps Script - Automação Portal Dr. Marcio
// Este arquivo deve ser copiado para o Google Apps Script da planilha

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Gestão Dr. Marcio')
    .addItem('Criar Aba Gestão', 'criarAbaGestao')
    .addItem('Atualizar Dashboard', 'atualizarDashboard')
    .addItem('Criar Filtros', 'criarFiltros')
    .addItem('Gerar Relatório', 'gerarRelatorio')
    .addItem('Sincronizar Usuários', 'sincronizarUsuarios')
    .addToUi();
}

function criarAbaGestao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Verificar se a aba já existe
  let sheet = ss.getSheetByName('Gestao_Geral');
  if (!sheet) {
    sheet = ss.insertSheet('Gestao_Geral');
  }
  
  // Limpar conteúdo existente
  sheet.clear();
  
  // Cabeçalhos
  const headers = [
    'ID_Paciente',
    'Nome_Paciente',
    'Data_Criacao',
    'Data_Ultima_Update',
    'Agendamento_Data',
    'Agendamento_Hora',
    'Agendamento_Status',
    'Consulta_Status',
    'Consulta_Observacao',
    'Orcamento_Status',
    'Orcamento_Data',
    'Orcamento_Link_Editar',
    'Orcamento_PDF_Link',
    'Orcamento_Link_Aceite',
    'Orcamento_Status_Aceite',
    'Pagamento_Valor_Entrada',
    'Pagamento_Comprovante',
    'Pagamento_Observacao',
    'Status_Geral',
    'Ultima_Acao'
  ];
  
  // Inserir cabeçalhos
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Formatação dos cabeçalhos
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Configurar largura das colunas
  const columnWidths = [120, 200, 120, 120, 120, 100, 150, 150, 200, 150, 120, 150, 150, 150, 150, 120, 150, 200, 150, 150];
  
  for (let i = 0; i < columnWidths.length; i++) {
    sheet.setColumnWidth(i + 1, columnWidths[i]);
  }
  
  // Congelar primeira linha
  sheet.setFrozenRows(1);
  
  // Criar validação de dados para status
  criarValidacaoStatus(sheet);
  
  // Criar formatação condicional
  criarFormatacaoCondicional(sheet);
  
  Logger.log('Aba Gestao_Geral criada com sucesso!');
  SpreadsheetApp.getUi().alert('Aba Gestao_Geral criada com sucesso!');
}

function criarValidacaoStatus(sheet) {
  // Status de Agendamento
  const agendamentoStatus = ['Pendente', 'Confirmado', 'Reagendado', 'Cancelado', 'Realizado'];
  const agendamentoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(agendamentoStatus)
    .setAllowInvalid(false)
    .build();
  
  // Status de Consulta
  const consultaStatus = ['Não Realizada', 'Em Andamento', 'Concluída', 'Cancelada'];
  const consultaRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(consultaStatus)
    .setAllowInvalid(false)
    .build();
  
  // Status de Orçamento
  const orcamentoStatus = ['Não Enviado', 'Em Elaboração', 'Enviado', 'Aceito', 'Rejeitado', 'Expirado'];
  const orcamentoRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(orcamentoStatus)
    .setAllowInvalid(false)
    .build();
  
  // Status de Aceite
  const aceiteStatus = ['Pendente', 'Aceito', 'Rejeitado', 'Expirado'];
  const aceiteRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(aceiteStatus)
    .setAllowInvalid(false)
    .build();
  
  // Status Geral
  const geralStatus = ['Novo', 'Em Atendimento', 'Aguardando Pagamento', 'Pago', 'Concluído', 'Cancelado'];
  const geralRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(geralStatus)
    .setAllowInvalid(false)
    .build();
  
  // Aplicar validações (para as primeiras 1000 linhas)
  sheet.getRange('G2:G1000').setDataValidation(agendamentoRule);
  sheet.getRange('H2:H1000').setDataValidation(consultaRule);
  sheet.getRange('J2:J1000').setDataValidation(orcamentoRule);
  sheet.getRange('O2:O1000').setDataValidation(aceiteRule);
  sheet.getRange('S2:S1000').setDataValidation(geralRule);
}

function criarFormatacaoCondicional(sheet) {
  // Formatação para Status Geral
  const rules = [];
  
  // Verde para Concluído
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Concluído')
    .setBackground('#d9ead3')
    .setRanges([sheet.getRange('S2:S1000')])
    .build());
  
  // Vermelho para Cancelado
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Cancelado')
    .setBackground('#f4cccc')
    .setRanges([sheet.getRange('S2:S1000')])
    .build());
  
  // Amarelo para Aguardando Pagamento
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Aguardando Pagamento')
    .setBackground('#fff2cc')
    .setRanges([sheet.getRange('S2:S1000')])
    .build());
  
  // Azul para Em Atendimento
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Em Atendimento')
    .setBackground('#cfe2f3')
    .setRanges([sheet.getRange('S2:S1000')])
    .build());
  
  // Laranja para Novo
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Novo')
    .setBackground('#fce5cd')
    .setRanges([sheet.getRange('S2:S1000')])
    .build());
  
  sheet.setConditionalFormatRules(rules);
}

function adicionarPacienteGestao(dadosPaciente) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Gestao_Geral');
  
  if (!sheet) {
    criarAbaGestao();
    sheet = ss.getSheetByName('Gestao_Geral');
  }
  
  const novaLinha = [
    dadosPaciente.idPaciente || '',
    dadosPaciente.nomePaciente || '',
    new Date(),
    new Date(),
    dadosPaciente.agendamentoData || '',
    dadosPaciente.agendamentoHora || '',
    'Pendente',
    'Não Realizada',
    '',
    'Não Enviado',
    '',
    '',
    '',
    '',
    'Pendente',
    '',
    '',
    '',
    'Novo',
    'Paciente cadastrado via automação'
  ];
  
  sheet.appendRow(novaLinha);
}

function atualizarStatusGestao(idPaciente, campo, valor, observacao = '') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Gestao_Geral');
  
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === idPaciente) {
      // Atualizar Data_Ultima_Update
      sheet.getRange(i + 1, 4).setValue(new Date());
      
      // Atualizar campo específico
      const colunas = {
        'agendamento_status': 7,
        'consulta_status': 8,
        'consulta_observacao': 9,
        'orcamento_status': 10,
        'orcamento_data': 11,
        'orcamento_link_editar': 12,
        'orcamento_pdf_link': 13,
        'orcamento_link_aceite': 14,
        'orcamento_status_aceite': 15,
        'pagamento_valor_entrada': 16,
        'pagamento_comprovante': 17,
        'pagamento_observacao': 18,
        'status_geral': 19,
        'ultima_acao': 20
      };
      
      if (colunas[campo]) {
        sheet.getRange(i + 1, colunas[campo]).setValue(valor);
      }
      
      // Atualizar última ação se fornecida
      if (observacao) {
        sheet.getRange(i + 1, 20).setValue(observacao);
      }
      
      break;
    }
  }
}

function criarFiltros() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Gestao_Geral');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Aba Gestao_Geral não encontrada! Execute "Criar Aba Gestão" primeiro.');
    return;
  }
  
  // Criar filtro na primeira linha
  const range = sheet.getDataRange();
  range.createFilter();
  
  SpreadsheetApp.getUi().alert('Filtros criados com sucesso! Use as setas nos cabeçalhos para filtrar.');
}

function atualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Gestao_Geral');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Aba Gestao_Geral não encontrada! Execute "Criar Aba Gestão" primeiro.');
    return;
  }
  
  // Criar/atualizar aba Dashboard
  let dashboardSheet = ss.getSheetByName('Dashboard_Resumo');
  if (dashboardSheet) {
    dashboardSheet.clear();
  } else {
    dashboardSheet = ss.insertSheet('Dashboard_Resumo');
  }
  
  const dados = calcularEstatisticas(sheet);
  montarDashboard(dashboardSheet, dados);
  
  SpreadsheetApp.getUi().alert('Dashboard atualizado na aba "Dashboard_Resumo"!');
}

function calcularEstatisticas(sheet) {
  const data = sheet.getDataRange().getValues();
  
  let statusCount = {};
  let agendamentosHoje = 0;
  let agendamentosProximosDias = 0;
  let orcamentosEnviados = 0;
  let pagamentosPendentes = 0;
  let consultasRealizadas = 0;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const proximosDias = new Date();
  proximosDias.setDate(proximosDias.getDate() + 7);
  proximosDias.setHours(23, 59, 59, 999);
  
  for (let i = 1; i < data.length; i++) {
    const statusGeral = data[i][18] || 'Indefinido';
    const agendamentoData = data[i][4];
    const orcamentoStatus = data[i][9];
    const consultaStatus = data[i][7];
    
    // Contar status geral
    statusCount[statusGeral] = (statusCount[statusGeral] || 0) + 1;
    
    // Agendamentos hoje
    if (agendamentoData && agendamentoData instanceof Date) {
      const agendData = new Date(agendamentoData);
      agendData.setHours(0, 0, 0, 0);
      
      if (agendData.getTime() === hoje.getTime()) {
        agendamentosHoje++;
      }
      
      if (agendData >= hoje && agendData <= proximosDias) {
        agendamentosProximosDias++;
      }
    }
    
    // Orçamentos enviados
    if (orcamentoStatus === 'Enviado') {
      orcamentosEnviados++;
    }
    
    // Pagamentos pendentes
    if (statusGeral === 'Aguardando Pagamento') {
      pagamentosPendentes++;
    }
    
    // Consultas realizadas
    if (consultaStatus === 'Concluída') {
      consultasRealizadas++;
    }
  }
  
  return {
    totalPacientes: data.length - 1,
    agendamentosHoje,
    agendamentosProximosDias,
    orcamentosEnviados,
    pagamentosPendentes,
    consultasRealizadas,
    statusCount
  };
}

function montarDashboard(sheet, dados) {
  // Título
  sheet.getRange('A1').setValue('DASHBOARD - PORTAL DR. MARCIO');
  sheet.getRange('A1:F1').merge();
  sheet.getRange('A1').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#4285f4').setFontColor('white');
  
  let linha = 3;
  
  // Última atualização
  sheet.getRange(`A${linha}`).setValue('Última Atualização:');
  sheet.getRange(`B${linha}`).setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  linha += 2;
  
  // Resumo principal
  sheet.getRange(`A${linha}`).setValue('📊 RESUMO PRINCIPAL');
  sheet.getRange(`A${linha}:B${linha}`).merge().setFontWeight('bold').setBackground('#e6f3ff').setFontSize(14);
  linha += 2;
  
  const resumoPrincipal = [
    ['👥 Total de Pacientes:', dados.totalPacientes],
    ['📅 Agendamentos Hoje:', dados.agendamentosHoje],
    ['🗓️ Agendamentos Próximos 7 dias:', dados.agendamentosProximosDias],
    ['💰 Orçamentos Enviados:', dados.orcamentosEnviados],
    ['⏳ Pagamentos Pendentes:', dados.pagamentosPendentes],
    ['✅ Consultas Realizadas:', dados.consultasRealizadas]
  ];
  
  for (const [label, valor] of resumoPrincipal) {
    sheet.getRange(`A${linha}`).setValue(label);
    sheet.getRange(`B${linha}`).setValue(valor);
    linha++;
  }
  
  linha += 2;
  
  // Status por categoria
  sheet.getRange(`A${linha}`).setValue('📈 STATUS POR CATEGORIA');
  sheet.getRange(`A${linha}:B${linha}`).merge().setFontWeight('bold').setBackground('#e6f3ff').setFontSize(14);
  linha += 2;
  
  for (const [status, count] of Object.entries(dados.statusCount)) {
    sheet.getRange(`A${linha}`).setValue(status + ':');
    sheet.getRange(`B${linha}`).setValue(count);
    
    // Colorir baseado no status
    const cor = obterCorStatus(status);
    if (cor) {
      sheet.getRange(`A${linha}:B${linha}`).setBackground(cor);
    }
    
    linha++;
  }
  
  // Formatação geral
  sheet.autoResizeColumns(1, 6);
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 100);
}

function obterCorStatus(status) {
  const cores = {
    'Concluído': '#d9ead3',
    'Cancelado': '#f4cccc',
    'Aguardando Pagamento': '#fff2cc',
    'Em Atendimento': '#cfe2f3',
    'Novo': '#fce5cd',
    'Pago': '#d9ead3'
  };
  
  return cores[status] || null;
}

function sincronizarUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usuarioSheet = ss.getSheetByName('Usuario');
  const gestaoSheet = ss.getSheetByName('Gestao_Geral');
  
  if (!usuarioSheet) {
    SpreadsheetApp.getUi().alert('Aba "Usuario" não encontrada!');
    return;
  }
  
  if (!gestaoSheet) {
    SpreadsheetApp.getUi().alert('Aba "Gestao_Geral" não encontrada! Execute "Criar Aba Gestão" primeiro.');
    return;
  }
  
  const usuarioData = usuarioSheet.getDataRange().getValues();
  const gestaoData = gestaoSheet.getDataRange().getValues();
  
  // Criar mapa dos IDs existentes na gestão
  const idsExistentes = new Set();
  for (let i = 1; i < gestaoData.length; i++) {
    idsExistentes.add(gestaoData[i][0]);
  }
  
  let novosRegistros = 0;
  
  // Procurar por pacientes na aba Usuario
  for (let i = 1; i < usuarioData.length; i++) {
    const userRole = usuarioData[i][4]; // Coluna role
    const userId = usuarioData[i][5];   // Coluna user_id
    const fullName = usuarioData[i][1]; // Coluna full_name
    const dataCriacao = usuarioData[i][9]; // Coluna data_criacao
    
    if (userRole === 'patient' && !idsExistentes.has(userId)) {
      // Adicionar novo paciente na gestão
      const novaLinha = [
        userId,
        fullName,
        dataCriacao || new Date(),
        new Date(),
        '',
        '',
        'Pendente',
        'Não Realizada',
        '',
        'Não Enviado',
        '',
        '',
        '',
        '',
        'Pendente',
        '',
        '',
        '',
        'Novo',
        'Sincronizado automaticamente'
      ];
      
      gestaoSheet.appendRow(novaLinha);
      novosRegistros++;
    }
  }
  
  SpreadsheetApp.getUi().alert(`Sincronização concluída! ${novosRegistros} novos pacientes adicionados à gestão.`);
}

function gerarRelatorio() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Gestao_Geral');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Aba Gestao_Geral não encontrada! Execute "Criar Aba Gestão" primeiro.');
    return;
  }
  
  // Criar aba de relatório
  let relatorioSheet = ss.getSheetByName('Relatorio_Detalhado');
  if (relatorioSheet) {
    ss.deleteSheet(relatorioSheet);
  }
  
  relatorioSheet = ss.insertSheet('Relatorio_Detalhado');
  
  const dados = calcularEstatisticas(sheet);
  const dataRelatorio = sheet.getDataRange().getValues();
  
  montarRelatorioDetalhado(relatorioSheet, dados, dataRelatorio);
  
  SpreadsheetApp.getUi().alert('Relatório detalhado gerado na aba "Relatorio_Detalhado"!');
}

function montarRelatorioDetalhado(sheet, dados, dataCompleta) {
  let linha = 1;
  
  // Cabeçalho do relatório
  sheet.getRange(`A${linha}`).setValue('RELATÓRIO DETALHADO - GESTÃO DR. MARCIO');
  sheet.getRange(`A${linha}:H${linha}`).merge();
  sheet.getRange(`A${linha}`).setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#4285f4').setFontColor('white');
  linha += 2;
  
  // Data e hora do relatório
  sheet.getRange(`A${linha}`).setValue('Gerado em:');
  sheet.getRange(`B${linha}`).setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm:ss');
  linha += 3;
  
  // Seção de estatísticas resumidas
  montarSecaoEstatisticas(sheet, dados, linha);
  linha += Object.keys(dados.statusCount).length + 10;
  
  // Seção de análise por período
  montarSecaoAnalise(sheet, dataCompleta, linha);
}

function montarSecaoEstatisticas(sheet, dados, linhaInicio) {
  let linha = linhaInicio;
  
  sheet.getRange(`A${linha}`).setValue('📊 ESTATÍSTICAS GERAIS');
  sheet.getRange(`A${linha}:C${linha}`).merge().setFontWeight('bold').setBackground('#e6f3ff').setFontSize(14);
  linha += 2;
  
  const estatisticas = [
    ['Indicador', 'Valor', 'Observação'],
    ['Total de Pacientes', dados.totalPacientes, 'Todos os registros'],
    ['Agendamentos Hoje', dados.agendamentosHoje, 'Data atual'],
    ['Agendamentos 7 dias', dados.agendamentosProximosDias, 'Próximos 7 dias'],
    ['Orçamentos Enviados', dados.orcamentosEnviados, 'Aguardando resposta'],
    ['Pagamentos Pendentes', dados.pagamentosPendentes, 'Aguardando pagamento'],
    ['Consultas Realizadas', dados.consultasRealizadas, 'Finalizadas']
  ];
  
  for (let i = 0; i < estatisticas.length; i++) {
    for (let j = 0; j < estatisticas[i].length; j++) {
      sheet.getRange(linha + i, 1 + j).setValue(estatisticas[i][j]);
    }
    
    if (i === 0) {
      sheet.getRange(linha + i, 1, 1, 3).setFontWeight('bold').setBackground('#f0f0f0');
    }
  }
}

function montarSecaoAnalise(sheet, dataCompleta, linhaInicio) {
  let linha = linhaInicio;
  
  sheet.getRange(`A${linha}`).setValue('📈 ANÁLISE DETALHADA');
  sheet.getRange(`A${linha}:D${linha}`).merge().setFontWeight('bold').setBackground('#e6f3ff').setFontSize(14);
  linha += 2;
  
  // Analisar conversão do funil
  const analise = analisarFunilConversao(dataCompleta);
  
  const analiseHeaders = ['Etapa do Funil', 'Quantidade', 'Percentual', 'Observação'];
  for (let j = 0; j < analiseHeaders.length; j++) {
    sheet.getRange(linha, 1 + j).setValue(analiseHeaders[j]);
  }
  sheet.getRange(linha, 1, 1, 4).setFontWeight('bold').setBackground('#f0f0f0');
  linha++;
  
  for (const etapa of analise) {
    sheet.getRange(linha, 1).setValue(etapa.nome);
    sheet.getRange(linha, 2).setValue(etapa.quantidade);
    sheet.getRange(linha, 3).setValue(etapa.percentual + '%');
    sheet.getRange(linha, 4).setValue(etapa.observacao);
    linha++;
  }
}

function analisarFunilConversao(data) {
  let pacientesNovos = 0;
  let emAtendimento = 0;
  let aguardandoPagamento = 0;
  let pagos = 0;
  let concluidos = 0;
  
  const total = data.length - 1; // Excluir cabeçalho
  
  for (let i = 1; i < data.length; i++) {
    const status = data[i][18];
    
    switch (status) {
      case 'Novo': pacientesNovos++; break;
      case 'Em Atendimento': emAtendimento++; break;
      case 'Aguardando Pagamento': aguardandoPagamento++; break;
      case 'Pago': pagos++; break;
      case 'Concluído': concluidos++; break;
    }
  }
  
  return [
    {
      nome: 'Pacientes Novos',
      quantidade: pacientesNovos,
      percentual: Math.round((pacientesNovos / total) * 100),
      observacao: 'Recém cadastrados'
    },
    {
      nome: 'Em Atendimento',
      quantidade: emAtendimento,
      percentual: Math.round((emAtendimento / total) * 100),
      observacao: 'Processo ativo'
    },
    {
      nome: 'Aguardando Pagamento',
      quantidade: aguardandoPagamento,
      percentual: Math.round((aguardandoPagamento / total) * 100),
      observacao: 'Orçamento aprovado'
    },
    {
      nome: 'Pagos',
      quantidade: pagos,
      percentual: Math.round((pagos / total) * 100),
      observacao: 'Pagamento confirmado'
    },
    {
      nome: 'Concluídos',
      quantidade: concluidos,
      percentual: Math.round((concluidos / total) * 100),
      observacao: 'Processo finalizado'
    }
  ];
}

// Função auxiliar para executar múltiplas ações
function configuracaoCompleta() {
  criarAbaGestao();
  Utilities.sleep(1000);
  criarFiltros();
  Utilities.sleep(1000);
  sincronizarUsuarios();
  Utilities.sleep(1000);
  atualizarDashboard();
  
  SpreadsheetApp.getUi().alert('Configuração completa finalizada! Todas as abas e funcionalidades foram criadas.');
}
