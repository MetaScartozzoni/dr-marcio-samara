// 🔐 Sistema de Autenticação - Edge Function
import { createClient } from '@supabase/supabase-js';

// Inicializa cliente Supabase com variáveis de ambiente
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

/**
 * Login de usuário
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }
    
    // Autenticar usuário
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });
    
    if (authError) {
      console.error('Erro na autenticação:', authError);
      
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }
    
    // Obter dados do usuário da tabela usuarios
    const { data: userData, error: userError } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados do usuário'
      });
    }
    
    // Verificar se o usuário está ativo
    if (userData.status !== 'ativo') {
      return res.status(403).json({
        success: false,
        error: 'Conta desativada. Entre em contato com o administrador.'
      });
    }
    
    // Preparar resposta
    return res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        tipoUsuario: userData.tipo_usuario,
        permissions: userData.permissions || [],
        createdAt: userData.created_at
      },
      token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no servidor durante autenticação'
    });
  }
}

/**
 * Verificação de email
 */
export async function verifyEmail(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }
    
    // Verificar se email já está cadastrado
    const { data: users, error: userError, count } = await supabaseClient
      .from('usuarios')
      .select('*', { count: 'exact' })
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (userError) throw userError;
    
    // Verificar se já existem administradores
    const { count: adminCount, error: adminError } = await supabaseClient
      .from('usuarios')
      .select('*', { count: 'exact' })
      .eq('tipo_usuario', 'admin');
    
    if (adminError) throw adminError;
    
    // Decisão baseada nas verificações
    if (count > 0) {
      // Email já cadastrado
      return res.status(200).json({
        success: true,
        acao: 'login',
        mensagem: 'Email encontrado. Redirecionando para login.'
      });
    } else if (adminCount === 0) {
      // Nenhum admin cadastrado ainda, este será o primeiro
      return res.status(200).json({
        success: true,
        acao: 'cadastro_admin',
        mensagem: 'Você será o primeiro administrador do sistema.',
        tipo: 'admin'
      });
    } else {
      // Email não cadastrado, fluxo padrão
      return res.status(200).json({
        success: true,
        acao: 'cadastro',
        mensagem: 'Email não encontrado. Preencha seus dados para cadastro.',
        tipo: 'funcionario'
      });
    }
    
  } catch (error) {
    console.error('Erro na verificação de email:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no servidor durante verificação de email'
    });
  }
}

/**
 * Registro de usuário
 */
export async function register(req, res) {
  try {
    const { email, nome, password, tipoUsuario } = req.body;
    
    if (!email || !nome || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, nome e senha são obrigatórios'
      });
    }
    
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        tipo_usuario: tipoUsuario || 'paciente'
      }
    });
    
    if (authError) {
      console.error('Erro ao criar usuário na autenticação:', authError);
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }
    
    // Criar no banco de dados
    const { data: userData, error: userError } = await supabaseClient
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        email: email.toLowerCase(),
        nome,
        tipo_usuario: tipoUsuario || 'paciente',
        status: tipoUsuario === 'admin' ? 'ativo' : 'aguardando_aprovacao'
      }])
      .select()
      .single();
    
    if (userError) {
      console.error('Erro ao criar usuário no banco:', userError);
      
      // Tentar rollback do Auth user
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar usuário no banco de dados'
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        tipoUsuario: userData.tipo_usuario,
        status: userData.status
      },
      message: 'Usuário registrado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro no servidor durante registro'
    });
  }
}
