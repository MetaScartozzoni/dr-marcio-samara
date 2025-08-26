# Módulo de Autenticação

Este módulo centraliza toda a lógica de autenticação do sistema, garantindo segurança e controle de acesso para usuários, administradores e integrações externas.

## Funcionalidades
- Middleware de autenticação (JWT, OAuth ou outro padrão do projeto)
- Proteção de rotas e endpoints
- Fluxo de login, cadastro, recuperação de senha
- Integração com variáveis de ambiente para configuração segura
- Auditoria de acessos e tentativas

## Como usar
- Importe o middleware de autenticação nas rotas que exigem acesso protegido.
- Configure as variáveis de ambiente necessárias (`JWT_SECRET`, `TOKEN_EXPIRATION`, etc).
- Consulte exemplos de uso abaixo e nos testes automatizados.


## Exemplos de uso

### Proteger rotas principais
```js
const { authMiddleware } = require('./src/auth/middleware');
app.use('/api/pacientes', authMiddleware);
app.use('/api/funcionarios', authMiddleware);
app.use('/api/admin', authMiddleware);
// ...outras rotas essenciais
```

### Gerar token JWT
```js
const { gerarToken } = require('./src/auth/middleware');
const token = gerarToken({ id: usuario.id, email: usuario.email });
```

### Gerar e renovar refresh token
```js
const { gerarRefreshToken, renovarToken } = require('./src/auth/middleware');
const refreshToken = gerarRefreshToken({ id: usuario.id, email: usuario.email });
const novoAccessToken = renovarToken(refreshToken);
```

### Revogar token (logout seguro)
```js
const { revogarToken } = require('./src/auth/middleware');
revogarToken(token);
```

### Consultar auditoria de acessos
```js
const { consultarAuditoria } = require('./src/auth/middleware');
const logs = consultarAuditoria();
```

## Variáveis de ambiente
- `JWT_SECRET`: Chave secreta para geração/validação dos tokens
- `TOKEN_EXPIRATION`: Tempo de expiração dos tokens
- Outras conforme integração (OAuth, etc)

## Auditoria
- Todos os acessos e tentativas de login são registrados para análise de segurança.

## Testes
- Testes automatizados garantem que apenas usuários autenticados acessam rotas protegidas.

## Manutenção
- Elimine arquivos duplicados e desatualizados.
- Atualize este README sempre que houver mudanças relevantes.

---

> Para dúvidas ou problemas, consulte a documentação principal ou entre em contato com o responsável pelo módulo.
