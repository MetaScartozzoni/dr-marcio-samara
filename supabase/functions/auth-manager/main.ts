// Edge Function - Auth Manager
import { serve } from "http/server";
import { login, register, verifyEmail } from "./index.js";

// Mapeia rotas para funções
const routeMap = {
  '/login': login,
  '/register': register,
  '/verify-email': verifyEmail
};

serve(async (req) => {
  try {
    // Obter rota da URL
    const url = new URL(req.url);
    const path = url.pathname.replace('/auth-manager', '');
    
    // Verificar se existe uma função para a rota solicitada
    const handler = routeMap[path];
    
    if (!handler) {
      return new Response(
        JSON.stringify({ 
          error: 'Rota não encontrada', 
          path,
          available_routes: Object.keys(routeMap)
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parsear corpo da requisição
    let body = {};
    if (req.method !== 'GET') {
      try {
        body = await req.json();
      } catch (e) {
        console.error('Erro ao processar corpo da requisição:', e);
      }
    }
    
    // Criar resposta personalizada
    const resObj = {
      status: (code) => {
        resObj._status = code;
        return resObj;
      },
      json: (data) => {
        resObj._data = data;
        return resObj;
      },
      _status: 200,
      _data: {}
    };
    
    // Chamar handler com os parâmetros apropriados
    await handler({ 
      body,
      method: req.method,
      headers: req.headers,
      url: req.url
    }, resObj);
    
    // Retornar resposta formatada
    return new Response(
      JSON.stringify(resObj._data),
      { 
        status: resObj._status, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no servidor',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
