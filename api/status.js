// API para verificar status do sistema - funciona como health check
import { initSupabase, handleError } from './_utils';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Apenas permitir GET para esta rota
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  try {
    const supabase = initSupabase();
    
    // Testar conexão com Supabase
    const { data, error } = await supabase
      .from('system_status')
      .select('status, version, last_updated')
      .limit(1);
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      message: 'API funcionando',
      timestamp: new Date().toISOString(),
      status: 'online',
      systemData: data?.[0] || { status: 'active' },
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    return handleError(error, res);
  }
}
