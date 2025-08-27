// supabase/functions/verificar-codigo-otp/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

interface VerificationPayload {
  email: string;
  codigo: string;
  tipo: 'login' | 'recuperacao' | 'confirmacao';
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
    const { email, codigo, tipo }: VerificationPayload = await req.json();

    // Validar campos obrigatórios
    if (!email || !codigo || !tipo) {
      return new Response(JSON.stringify({
        error: 'Dados incompletos. Email, código e tipo são obrigatórios.'
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
        verificationType = 'email'; // também usa o tipo 'email' para confirmação
        break;
    }

    // Verificar o código OTP com o Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: verificationType
    });

    if (error) {
      console.error('Erro na verificação OTP:', error);

      // Tratar erros específicos
      let errorMessage = 'Código inválido ou expirado';
      if (error.message.includes('expired')) {
        errorMessage = 'Código expirado. Solicite um novo código.';
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Código inválido. Verifique e tente novamente.';
      } else if (error.message.includes('not_found')) {
        errorMessage = 'Email não encontrado ou código não solicitado.';
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

    // Código verificado com sucesso
    return new Response(JSON.stringify({
      success: true,
      message: 'Código verificado com sucesso',
      session: data.session, // contém o token de autenticação
      user: data.user
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Erro interno:', err);

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
