// _middleware.js para Railway
export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;
  
  // Verificar se o usuário está autenticado usando cookies
  const authToken = request.cookies.get('auth_token');
  const isAuthenticated = authToken && authToken !== 'undefined' && authToken !== '';
  
  // Rotas que requerem autenticação
  const protectedRoutes = [
    '/dashboard',
    '/dashboard-admin',
    '/dashboard-funcionario',
    '/prontuarios',
    '/agendar',
    '/agendamentos',
    '/caderno-digital'
  ];
  
  // Verifica se está tentando acessar uma rota protegida sem autenticação
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    return Response.redirect(new URL('/login', request.url));
  }
  
  // Se estiver autenticado e tentar acessar login/cadastro, redireciona para dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/cadastro')) {
    return Response.redirect(new URL('/dashboard', request.url));
  }
  
  // Continua com a requisição normalmente
  return Response.next();
}

// Configuração das rotas que devem ser processadas pelo middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos exceto:
     * 1. /api (rotas de API)
     * 2. /_next (arquivos Next.js)
     * 3. /_static (arquivos estáticos)
     * 4. /assets (recursos como imagens, css, js)
     * 5. /favicon.ico, /sitemap.xml, /robots.txt etc.
     */
    '/((?!api|_next|_static|assets|favicon.ico|sitemap.xml|robots.txt|sw.js).*)',
  ],
};
