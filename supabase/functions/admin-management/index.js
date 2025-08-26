// 👑 Sistema de Primeiro Admin - Edge Function
import { createClient } from '@supabase/supabase-js';

/**
 * Exemplo de implementação da Edge Function para verificar o primeiro acesso
 * Esta função verifica se já existem administradores no sistema
 */

// Inicializa cliente Supabase com variáveis de ambiente
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
);

// Esta seria uma função Supabase Edge Function
export async function checkFirstAccess(req, res) {
  try {
    // Verificar se existem usuários administradores
    const { data, error, count } = await supabaseClient
      .from('usuarios')
      .select('*', { count: 'exact' })
      .eq('tipo_usuario', 'admin')
      .limit(1);
    
    if (error) throw error;
    
    // Responder com o status do sistema
    return res.status(200).json({
      success: true,
      is_first_access: count === 0,
      has_admins: count > 0,
      setup_completed: count > 0
    });
  } catch (error) {
    console.error('Erro ao verificar primeiro acesso:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao verificar status do sistema',
      is_first_access: false,
      has_admins: true // Assumir que há admins por segurança
    });
  }
}

/**
 * Exemplo de implementação da Edge Function para registrar o primeiro administrador
 * Esta função cria o primeiro usuário administrador com permissões especiais
 */

export async function registerFirstAdmin(req, res) {
  try {
    const { email, nome, senha, token_verificacao } = req.body;
    
    // Verificar se já existem administradores
    const { count, error: countError } = await supabaseClient
      .from('usuarios')
      .select('*', { count: 'exact' })
      .eq('tipo_usuario', 'admin');
    
    if (countError) throw countError;
    
    // Se já existem administradores, rejeitar a operação
    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Operação não permitida. O sistema já possui um administrador.'
      });
    }
    
    // Verificar token de segurança
    const firstAdminToken = Deno.env.get('FIRST_ADMIN_TOKEN');
    if (!firstAdminToken || token_verificacao !== firstAdminToken) {
      console.log('Token de verificação inválido para primeiro admin');
      
      return res.status(401).json({
        success: false,
        error: 'Token de verificação inválido.'
      });
    }
    
    // Criar usuário na tabela de autenticação do Supabase
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        tipo_usuario: 'admin',
        is_first_admin: true
      }
    });
    
    if (authError) throw authError;
    
    // Inserir na tabela de usuários
    const { data: dbUser, error: dbError } = await supabaseClient
      .from('usuarios')
      .insert([
        {
          id: authUser.id,
          email,
          nome,
          tipo_usuario: 'admin',
          permissions: ['super_admin'],
          status: 'ativo',
          is_first_admin: true
        }
      ])
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    // Criar registro do sistema indicando setup concluído
    await supabaseClient
      .from('system_settings')
      .upsert([
        {
          key: 'setup_completed',
          value: 'true',
          updated_at: new Date().toISOString()
        }
      ]);
    
    // Gerar token de autenticação para o novo usuário
    const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    
    if (sessionError) throw sessionError;
    
    // Responder com sucesso
    return res.status(200).json({
      success: true,
      message: 'Primeiro administrador criado com sucesso',
      user: {
        id: dbUser.id,
        email: dbUser.email,
        nome: dbUser.nome,
        tipo: 'admin',
        permissions: dbUser.permissions
      },
      token: session.properties.access_token
    });
    
  } catch (error) {
    console.error('Erro ao registrar primeiro administrador:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao criar primeiro administrador'
    });
  }
}

// Neste arquivo adicionaríamos outras funções relacionadas ao gerenciamento de administradores
