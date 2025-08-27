// supabase/functions/troca-codigo-token/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

interface TokenExchangeRequest {
  email: string;
  codigo: string;
  tipo?: 'login' | 'recuperacao' | 'confirmacao';
}

Deno.serve(async (req: Request) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Responder a requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Método não permitido'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Configuração do servidor incompleta'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extrair dados do corpo da requisição
    const { email, codigo, tipo = 'login' }: TokenExchangeRequest = await req.json();

    // Validar campos obrigatórios
    if (!email || !codigo) {
      return new Response(JSON.stringify({
        error: 'Email e código são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'Formato de email inválido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar código (deve ter exatamente 6 dígitos)
    if (codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
      return new Response(JSON.stringify({
        error: 'Código deve ter exatamente 6 dígitos numéricos'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mapear o tipo para o tipo esperado pelo Supabase
    let verificationType: 'email' | 'recovery' | 'sms' = 'email';
    switch (tipo) {
      case 'login':
        verificationType = 'email';
        break;
      case 'recuperacao':
        verificationType = 'recovery';
        break;
      case 'confirmacao':
        verificationType = 'email';
        break;
    }

    console.log(`🔄 Iniciando troca de código por token para ${email} (tipo: ${tipo})`);

    // Fase 1: Verificar código e trocar por token usando verifyOtp
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: codigo,
      type: verificationType
    });

    if (error) {
      console.error('❌ Erro na verificação OTP:', error);

      // Tratar erros específicos
      let errorMessage = 'Código inválido ou expirado';
      if (error.message.includes('expired')) {
        errorMessage = 'Código expirado. Solicite um novo código.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Código inválido. Verifique e tente novamente.';
      } else if (error.message.includes('not_found')) {
        errorMessage = 'Email não encontrado ou código não solicitado.';
      } else if (error.message.includes('too_many_attempts')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se a sessão foi criada com sucesso
    if (!data.session || !data.session.access_token) {
      console.error('❌ Sessão não criada adequadamente');
      return new Response(JSON.stringify({
        success: false,
        error: 'Falha ao criar sessão de autenticação'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Troca de código por token realizada com sucesso para ${email}`);

    // Sucesso! Retornar a sessão completa com tokens
    return new Response(JSON.stringify({
      success: true,
      message: 'Código verificado com sucesso! Token gerado.',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type
      },
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at,
        created_at: data.user?.created_at,
        updated_at: data.user?.updated_at,
        user_metadata: data.user?.user_metadata,
        app_metadata: data.user?.app_metadata
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Erro interno:', err);

    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      details: err.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
