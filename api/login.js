// API de autenticação para uso com Railway
import { initSupabase, handleError } from './_utils';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
  
  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas permitir POST para login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const supabase = initSupabase();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Autenticar com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Erro de autenticação:', error.message);
      return res.status(401).json({ 
        error: 'Erro na autenticação', 
        message: error.message
      });
    }
    
    // Buscar dados adicionais do usuário, se necessário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) {
      console.warn('Aviso: Não foi possível obter dados adicionais do usuário:', userError.message);
    }
    
    // Retornar tokens e dados do usuário
    return res.status(200).json({
      success: true,
      user: userData || data.user,
      session: data.session
    });
  } catch (error) {
    return handleError(error, res);
  }
}
