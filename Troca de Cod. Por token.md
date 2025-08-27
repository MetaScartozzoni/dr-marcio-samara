Troca de Código por Token de Autenticação
A troca de um código de verificação por um token de autenticação é uma parte essencial do fluxo OAuth e dos sistemas de autenticação por código. Vou explicar como isso funciona com o Supabase.

Como funciona a troca de código por token no Supabase
Quando um usuário verifica um código OTP (One-Time Password), o Supabase emite um token de acesso (JWT) que é usado para autenticar requisições subsequentes. Este processo ocorre automaticamente quando você usa os métodos de verificação do SDK do Supabase.

Usando o SDK do Supabase        

// Após o usuário inserir o código de verificação:
const { data, error } = await supabase.auth.verifyOtp({
  email: 'usuario@exemplo.com',
  token: '123456', // código inserido pelo usuário
  type: 'email' // ou 'recovery', 'sms', etc
});

if (data?.session) {
  // data.session contém:
  // - access_token: token JWT para autenticação
  // - refresh_token: para renovar o access_token
  // - expires_at: quando o token expira
  
  // O SDK do Supabase armazena automaticamente esses tokens
  // e os utiliza em requisições subsequentes
  console.log("Token de acesso:", data.session.access_token);
}


token-exchange
import { createClient } from 'npm:@supabase/supabase-js@2.39.6';

interface TokenExchangeRequest {
  email: string;
  codigo: string;
}

Deno.serve(async (req: Request) => {
  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Método não permitido' 
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Obter dados da requisição
    const { email, codigo }: TokenExchangeRequest = await req.json();
    
    if (!email || !codigo) {
      return new Response(JSON.stringify({ 
        error: 'Email e código são obrigatórios' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fase 1: Verificar se o código é válido
    // Opção 1: Verificar na tabela de códigos (se você implementou a sua própria)
    const { data: codigoValido, error: codigoError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', codigo)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (codigoError || !codigoValido) {
      return new Response(JSON.stringify({ 
        error: 'Código inválido ou expirado' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Marcar código como verificado
    await supabase
      .from('verification_codes')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', codigoValido.id);
    
    // Fase 2: Gerar token de sessão usando verifyOTP do Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: 'email'  // ou 'recovery', 'sms', dependendo do contexto
    });
    
    if (error) {
      return new Response(JSON.stringify({ 
        error: 'Falha na autenticação', 
        details: error.message 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sucesso! Retornar a sessão que contém os tokens
    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at
      },
      user: data.user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor', 
      details: err.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});



