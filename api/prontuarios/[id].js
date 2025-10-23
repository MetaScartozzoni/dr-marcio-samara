// API endpoint for fetching complete prontuário data
// GET /api/prontuarios/:id
const { Pool } = require('pg');
const ProntuarioService = require('../../src/services/prontuario.service');
const { adaptProntuarioCompleto } = require('../../src/services/prontuario.adapter');

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Simple JWT verification (matches existing auth middleware)
async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token não fornecido');
  }

  const token = authHeader.substring(7);
  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Verify user exists and is active
    const userQuery = `
      SELECT id, email, full_name, role, status
      FROM usuarios 
      WHERE id = $1 AND status = 'ativo'
    `;
    
    const { rows } = await pool.query(userQuery, [decoded.userId]);
    
    if (rows.length === 0) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    return rows[0];
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método não permitido' 
    });
  }
  
  try {
    // Verify authentication
    const user = await verifyToken(req);
    
    // Get prontuario ID from URL parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do prontuário é obrigatório'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido. Deve ser um UUID válido.'
      });
    }

    // Parse query parameters
    const options = {
      fichasLimit: parseInt(req.query.fichas_limit) || 5,
      orcamentosLimit: parseInt(req.query.orcamentos_limit) || 5,
      examesLimit: parseInt(req.query.exames_limit) || 5,
      agendamentosLimit: parseInt(req.query.agendamentos_limit) || 5,
      fichasCursor: req.query.fichas_cursor || null,
      orcamentosCursor: req.query.orcamentos_cursor || null,
      examesCursor: req.query.exames_cursor || null,
      agendamentosCursor: req.query.agendamentos_cursor || null
    };

    // Validate limits
    const maxLimit = 50;
    if (options.fichasLimit > maxLimit || options.orcamentosLimit > maxLimit ||
        options.examesLimit > maxLimit || options.agendamentosLimit > maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Limite máximo por consulta é ${maxLimit} registros`
      });
    }

    const showSensitive = req.query.show_sensitive === 'true';

    // TODO: Implement full Caderno Digital permission checks
    // For now, basic authentication check is sufficient
    
    // Fetch data using service
    const service = new ProntuarioService(pool);
    const data = await service.buscarCompleto(id, options);

    // Adapt response
    const adaptedData = adaptProntuarioCompleto(data, showSensitive);

    return res.status(200).json({
      success: true,
      data: adaptedData
    });

  } catch (error) {
    console.error('Erro ao buscar prontuário:', error);

    if (error.message === 'Token não fornecido' || 
        error.message === 'Token inválido ou expirado' ||
        error.message === 'Usuário não encontrado ou inativo') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Prontuário não encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};
