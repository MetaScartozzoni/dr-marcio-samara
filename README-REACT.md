# Portal Dr. Márcio - React Application

Sistema de gestão para clínica médica desenvolvido em React com Supabase.

## 🚀 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleBasedRoute.jsx
│   └── layout/
│       ├── Layout.jsx
│       └── AuthLayout.jsx
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── auth/
│   │   └── Login.jsx
│   └── dashboard/
│       └── Dashboard.jsx
├── App.jsx
├── index.js
└── routes.jsx
```

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd portal-dr-marcio-final
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Crie um arquivo `.env` na raiz do projeto:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configure o Supabase**

   - Crie um novo projeto no [Supabase](https://supabase.com)
   - Execute os scripts SQL para criar as tabelas necessárias
   - Configure as políticas RLS (Row Level Security)

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
npm start
```

### Build de Produção
```bash
npm run build
```

### Executar Servidor Backend
```bash
npm run server
```

### Desenvolvimento Completo (Frontend + Backend)
```bash
npm run dev
```

## 🔐 Sistema de Autenticação

O sistema utiliza Supabase Auth com suporte a três tipos de usuários:

- **Paciente**: Acesso básico ao portal
- **Funcionário**: Acesso a funcionalidades administrativas
- **Admin**: Acesso completo ao sistema

## 🎨 Componentes Principais

### AuthContext
Gerencia o estado de autenticação global da aplicação.

### ProtectedRoute
Protege rotas que requerem autenticação.

### RoleBasedRoute
Protege rotas baseadas no papel do usuário.

### Layout
Layout principal com sidebar responsiva.

### AuthLayout
Layout para páginas de autenticação.

## 📱 Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Sistema de roles (Paciente, Funcionário, Admin)
- ✅ Layout responsivo
- ✅ Roteamento protegido
- ✅ Dashboard personalizado por role
- 🔄 Migração de painéis HTML para React (em andamento)

## 🔄 Migração em Andamento

O projeto está em processo de migração dos painéis HTML existentes para componentes React. Os próximos passos incluem:

1. **Fase 2**: Migração dos dashboards específicos
2. **Fase 3**: Integração com APIs do Supabase
3. **Fase 4**: Implementação de funcionalidades avançadas

## 📚 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run server` - Inicia o servidor backend
- `npm run dev` - Executa frontend e backend simultaneamente
- `npm test` - Executa os testes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.
