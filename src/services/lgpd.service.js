// src/services/lgpd.service.js
const { Pool } = require('pg');

class LGPDService {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pFYtWUlDjHNTGWJGFUluAUyImYYqBGuf@yamabiko.proxy.rlwy.net:27448/railway',
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false,
        sslmode: 'require'
      } : { rejectUnauthorized: false },
      max: process.env.NODE_ENV === 'production' ? 10 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
  }

  // Registrar consentimento
  async registrarConsentimento(usuarioId, tipoConsentimento, finalidade, ipOrigem = null) {
    try {
      const query = `
        INSERT INTO consentimentos_lgpd (
          usuario_id, tipo_consentimento, finalidade, 
          data_consentimento, ip_origem, ativo
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, true)
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        usuarioId, 
        tipoConsentimento, 
        finalidade, 
        ipOrigem || this.getClientIP()
      ]);

      // Log da ação para auditoria
      await this.logAcaoLGPD(usuarioId, 'CONSENTIMENTO_REGISTRADO', {
        tipo: tipoConsentimento,
        finalidade,
        ip: ipOrigem
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao registrar consentimento LGPD:', error);
      throw new Error('Falha ao registrar consentimento');
    }
  }

  // Revogar consentimento
  async revogarConsentimento(usuarioId, tipoConsentimento, motivo) {
    try {
      const query = `
        UPDATE consentimentos_lgpd 
        SET ativo = false, data_revogacao = CURRENT_TIMESTAMP, motivo_revogacao = $3
        WHERE usuario_id = $1 AND tipo_consentimento = $2 AND ativo = true
        RETURNING *
      `;
      
      const result = await this.db.query(query, [usuarioId, tipoConsentimento, motivo]);

      await this.logAcaoLGPD(usuarioId, 'CONSENTIMENTO_REVOGADO', {
        tipo: tipoConsentimento,
        motivo
      });

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao revogar consentimento:', error);
      throw new Error('Falha ao revogar consentimento');
    }
  }

  // Exportar dados do usuário (Portabilidade de Dados)
  async exportarDadosUsuario(usuarioId, formatoExportacao = 'JSON') {
    try {
      const queries = {
        usuario: 'SELECT id, email, full_name, telefone, data_criacao, ultimo_login FROM usuarios WHERE id = $1',
        agendamentos: `
          SELECT a.*, s.nome as servico_nome, s.preco 
          FROM agendamentos a 
          LEFT JOIN servicos s ON a.servico_id = s.id 
          WHERE a.paciente_id = $1
        `,
        atendimentos: `
          SELECT id, agendamento_id, data_atendimento, observacoes, prescricoes, 
                 created_at, status 
          FROM atendimentos 
          WHERE paciente_id = $1
        `,
        orcamentos: `
          SELECT id, titulo, descricao, valor_total, status, data_criacao, 
                 data_validade, observacoes 
          FROM orcamentos 
          WHERE paciente_id = $1
        `,
        pagamentos: `
          SELECT p.id, p.valor, p.status, p.data_pagamento, p.metodo_pagamento,
                 o.titulo as orcamento_titulo
          FROM pagamentos p 
          JOIN orcamentos o ON p.orcamento_id = o.id 
          WHERE o.paciente_id = $1
        `,
        consentimentos: `
          SELECT tipo_consentimento, finalidade, data_consentimento, 
                 data_revogacao, ativo, ip_origem
          FROM consentimentos_lgpd 
          WHERE usuario_id = $1
        `,
        logs_acesso: `
          SELECT data_acesso, ip_origem, user_agent, acao
          FROM logs_acesso 
          WHERE usuario_id = $1
          ORDER BY data_acesso DESC
          LIMIT 100
        `
      };

      const dadosUsuario = {
        metadados: {
          data_exportacao: new Date().toISOString(),
          usuario_id: usuarioId,
          formato: formatoExportacao,
          versao_lgpd: '1.0'
        }
      };
      
      for (const [tabela, query] of Object.entries(queries)) {
        try {
          const { rows } = await this.db.query(query, [usuarioId]);
          dadosUsuario[tabela] = rows;
        } catch (queryError) {
          console.warn(`Erro ao exportar tabela ${tabela}:`, queryError);
          dadosUsuario[tabela] = [];
        }
      }

      // Anonimizar dados sensíveis se necessário
      const dadosLimpos = this.anonimizarDadosSensiveis(dadosUsuario);

      // Log da exportação
      await this.logAcaoLGPD(usuarioId, 'DADOS_EXPORTADOS', {
        formato: formatoExportacao,
        tabelas_exportadas: Object.keys(queries)
      });

      return dadosLimpos;
    } catch (error) {
      console.error('Erro ao exportar dados do usuário:', error);
      throw new Error('Falha na exportação de dados');
    }
  }

  // Anonimizar dados sensíveis
  anonimizarDadosSensiveis(dados) {
    // Criar cópia profunda para não modificar o original
    const dadosAnonimizados = JSON.parse(JSON.stringify(dados));

    // Anonimizar dados do usuário
    if (dadosAnonimizados.usuario && dadosAnonimizados.usuario[0]) {
      const usuario = dadosAnonimizados.usuario[0];
      if (usuario.telefone) {
        usuario.telefone = this.mascaraTelefone(usuario.telefone);
      }
    }

    // Anonimizar IPs em logs de acesso
    if (dadosAnonimizados.logs_acesso) {
      dadosAnonimizados.logs_acesso.forEach(log => {
        if (log.ip_origem) {
          log.ip_origem = this.mascaraIP(log.ip_origem);
        }
      });
    }

    // Anonimizar observações sensíveis
    if (dadosAnonimizados.atendimentos) {
      dadosAnonimizados.atendimentos.forEach(atendimento => {
        if (atendimento.observacoes) {
          atendimento.observacoes = this.anonimizarTextoMedico(atendimento.observacoes);
        }
      });
    }

    return dadosAnonimizados;
  }

  // Excluir dados do usuário (Direito ao Esquecimento)
  async excluirDadosUsuario(usuarioId, motivo, executadoPor = 'sistema') {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se o usuário existe
      const usuarioResult = await client.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
      if (usuarioResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const usuario = usuarioResult.rows[0];

      // Log da exclusão antes de executar
      await client.query(`
        INSERT INTO logs_exclusao_lgpd (
          usuario_id, email_original, motivo, data_exclusao, executado_por, status
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'INICIADO')
      `, [usuarioId, usuario.email, motivo, executadoPor]);

      // Anonimizar dados em vez de excluir (para manter integridade referencial)
      const emailAnonimizado = `anonimo_${usuarioId}_${Date.now()}@excluido.lgpd`;
      
      await client.query(`
        UPDATE usuarios SET 
          email = $2,
          full_name = 'Usuário Excluído - LGPD',
          telefone = NULL,
          password_hash = NULL,
          status = 'excluido_lgpd',
          data_exclusao_lgpd = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [usuarioId, emailAnonimizado]);

      // Anonimizar dados relacionados
      await client.query(`
        UPDATE agendamentos SET 
          observacoes = 'Dados anonimizados por solicitação LGPD - Art. 17',
          observacoes_internas = NULL
        WHERE paciente_id = $1
      `, [usuarioId]);

      await client.query(`
        UPDATE atendimentos SET 
          observacoes = 'Dados médicos anonimizados - LGPD',
          prescricoes = 'Prescrições anonimizadas - LGPD',
          diagnostico = NULL
        WHERE paciente_id = $1
      `, [usuarioId]);

      await client.query(`
        UPDATE orcamentos SET 
          observacoes = 'Dados anonimizados - LGPD',
          descricao = 'Descrição anonimizada - LGPD'
        WHERE paciente_id = $1
      `, [usuarioId]);

      // Revogar todos os consentimentos
      await client.query(`
        UPDATE consentimentos_lgpd SET 
          ativo = false,
          data_revogacao = CURRENT_TIMESTAMP,
          motivo_revogacao = 'Exclusão de dados - LGPD'
        WHERE usuario_id = $1 AND ativo = true
      `, [usuarioId]);

      // Marcar log como concluído
      await client.query(`
        UPDATE logs_exclusao_lgpd 
        SET status = 'CONCLUIDO', data_conclusao = CURRENT_TIMESTAMP
        WHERE usuario_id = $1 AND status = 'INICIADO'
      `, [usuarioId]);

      await client.query('COMMIT');
      
      // Log final da ação
      await this.logAcaoLGPD(usuarioId, 'DADOS_EXCLUIDOS', {
        motivo,
        executado_por: executadoPor,
        email_anonimizado: emailAnonimizado
      });

      return { 
        sucesso: true, 
        message: 'Dados anonimizados com sucesso conforme LGPD',
        usuario_id: usuarioId,
        email_anonimizado: emailAnonimizado
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro na exclusão LGPD:', error);
      
      // Log do erro
      await client.query(`
        UPDATE logs_exclusao_lgpd 
        SET status = 'ERRO', erro_detalhes = $2
        WHERE usuario_id = $1 AND status = 'INICIADO'
      `, [usuarioId, error.message]);
      
      throw new Error(`Falha na exclusão de dados: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Verificar consentimentos ativos
  async verificarConsentimentos(usuarioId) {
    try {
      const query = `
        SELECT tipo_consentimento, finalidade, data_consentimento, ativo
        FROM consentimentos_lgpd 
        WHERE usuario_id = $1 AND ativo = true
        ORDER BY data_consentimento DESC
      `;
      
      const result = await this.db.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      console.error('Erro ao verificar consentimentos:', error);
      throw new Error('Falha ao verificar consentimentos');
    }
  }

  // Relatório de conformidade LGPD
  async relatorioConformidade(dataInicio, dataFim) {
    try {
      const queries = {
        consentimentos_por_tipo: `
          SELECT tipo_consentimento, COUNT(*) as total,
                 COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
                 COUNT(CASE WHEN ativo = false THEN 1 END) as revogados
          FROM consentimentos_lgpd 
          WHERE data_consentimento BETWEEN $1 AND $2
          GROUP BY tipo_consentimento
        `,
        exclusoes_lgpd: `
          SELECT COUNT(*) as total_exclusoes,
                 COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END) as concluidas,
                 COUNT(CASE WHEN status = 'ERRO' THEN 1 END) as com_erro
          FROM logs_exclusao_lgpd
          WHERE data_exclusao BETWEEN $1 AND $2
        `,
        exportacoes_dados: `
          SELECT COUNT(*) as total_exportacoes,
                 details->>'formato' as formato
          FROM logs_lgpd
          WHERE acao = 'DADOS_EXPORTADOS' 
            AND created_at BETWEEN $1 AND $2
          GROUP BY details->>'formato'
        `
      };

      const relatorio = {
        periodo: { inicio: dataInicio, fim: dataFim },
        gerado_em: new Date().toISOString()
      };

      for (const [secao, query] of Object.entries(queries)) {
        try {
          const { rows } = await this.db.query(query, [dataInicio, dataFim]);
          relatorio[secao] = rows;
        } catch (queryError) {
          console.warn(`Erro na query ${secao}:`, queryError);
          relatorio[secao] = [];
        }
      }

      return relatorio;
    } catch (error) {
      console.error('Erro ao gerar relatório de conformidade:', error);
      throw new Error('Falha ao gerar relatório');
    }
  }

  // Log de ações LGPD para auditoria
  async logAcaoLGPD(usuarioId, acao, detalhes = {}) {
    try {
      const query = `
        INSERT INTO logs_lgpd (
          usuario_id, acao, details, ip_origem, created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      
      await this.db.query(query, [
        usuarioId,
        acao,
        JSON.stringify(detalhes),
        this.getClientIP()
      ]);
    } catch (error) {
      console.error('Erro ao registrar log LGPD:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  }

  // Métodos utilitários
  mascaraTelefone(telefone) {
    if (!telefone) return null;
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '$1*****$3');
  }

  mascaraIP(ip) {
    if (!ip) return null;
    const partes = ip.split('.');
    if (partes.length === 4) {
      return `${partes[0]}.${partes[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  anonimizarTextoMedico(texto) {
    if (!texto) return null;
    // Remove informações potencialmente sensíveis
    return texto
      .replace(/\b\d{11}\b/g, '[CPF_REMOVIDO]')
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF_REMOVIDO]')
      .replace(/\b\d{10,11}\b/g, '[TELEFONE_REMOVIDO]')
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REMOVIDO]');
  }

  getClientIP() {
    // Em produção, implementar captura real do IP
    return '127.0.0.1';
  }

  // Validar se usuário tem consentimento para ação específica
  async temConsentimento(usuarioId, tipoConsentimento) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM consentimentos_lgpd 
        WHERE usuario_id = $1 AND tipo_consentimento = $2 AND ativo = true
      `;
      
      const result = await this.db.query(query, [usuarioId, tipoConsentimento]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Erro ao verificar consentimento:', error);
      return false;
    }
  }
}

module.exports = new LGPDService();
