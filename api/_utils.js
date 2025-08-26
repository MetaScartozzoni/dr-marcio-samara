// Função auxiliar para estabelecer conexão com Supabase
import { createClient } from '@supabase/supabase-js';

// Inicializa cliente Supabase com variáveis de ambiente
export const initSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não definidas');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Função auxiliar para tratamento de erros
export const handleError = (error, res) => {
  console.error('API Error:', error);
  
  if (error.statusCode) {
    return res.status(error.statusCode).json({ 
      error: error.message || 'Ocorreu um erro na API' 
    });
  }
  
  return res.status(500).json({ 
    error: 'Erro interno do servidor' 
  });
};

// Middleware para verificação de autenticação
export const requireAuth = async (req, res, next) => {
  try {
    const supabase = initSupabase();
    const { user, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    req.user = user;
    return next();
  } catch (error) {
    return handleError(error, res);
  }
};

// Função para validar dados de entrada
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: `Dados inválidos: ${error.details.map(x => x.message).join(', ')}` 
        });
      }
      
      return next();
    } catch (error) {
      return handleError(error, res);
    }
  };
};
