// supabase/functions/gerar-codigo-otp/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

interface GenerateCodePayload {
  email: string;
  tipo: 'login' | 'recuperacao' | 'confirmacao';
  criarUsuario?: boolean;
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
    const { email, tipo, criarUsuario = true }: GenerateCodePayload = await req.json();

    // Validar campos obrigatórios
    if (!email || !tipo) {
      return new Response(JSON.stringify({
        error: 'Dados incompletos. Email e tipo são obrigatórios.'
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

    let result;

    // Lidar com diferentes tipos de código
    switch (tipo) {
      case 'login':
        // Para login, usar signInWithOtp
        const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: criarUsuario,
          }
        });

        if (signInError) {
          console.error('Erro ao gerar código de login:', signInError);
          return new Response(JSON.stringify({
            success: false,
            error: signInError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        result = signInData;
        break;

      case 'recuperacao':
        // Para recuperação de senha
        const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${new URL(req.url).origin}/reset-password`,
        });

        if (resetError) {
          console.error('Erro ao gerar código de recuperação:', resetError);
          return new Response(JSON.stringify({
            success: false,
            error: resetError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        result = resetData;
        break;

      case 'confirmacao':
        // Para confirmação de email (re-envio)
        const { data: resendData, error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });

        if (resendError) {
          console.error('Erro ao reenviar código de confirmação:', resendError);
          return new Response(JSON.stringify({
            success: false,
            error: resendError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        result = resendData;
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Tipo de código inválido. Use: login, recuperacao ou confirmacao'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Código gerado com sucesso
    return new Response(JSON.stringify({
      success: true,
      message: `Código de 6 dígitos enviado para ${email}`,
      email: email,
      tipo: tipo,
      data: result
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
