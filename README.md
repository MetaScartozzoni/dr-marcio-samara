# Estrutura de Pastas Padrão

Este repositório segue uma organização clara para facilitar manutenção, segurança e colaboração. Veja abaixo o modelo de estrutura e orientações:

## Estrutura Recomendada

```
root/
├── README.md                # Documentação principal do projeto
├── docs/                    # Documentação técnica e relatórios mensais
├── backup/                  # Backups semanais do banco e arquivos
├── src/                     # Código-fonte principal (backend, frontend, serviços)
│   ├── auth/                # Módulo de autenticação
│   ├── core/                # Funcionalidades essenciais
│   ├── integrations/        # Integrações externas (APIs, webhooks)
│   ├── models/              # Modelos de dados
│   ├── routes/              # Rotas da aplicação
│   └── utils/               # Utilitários e helpers
├── tests/                   # Testes automatizados
├── scripts/                 # Scripts de manutenção (backup, limpeza)
└── .env.example             # Exemplo de variáveis de ambiente
```

## Orientações Gerais
- **Documentação:** Cada módulo/pasta deve conter um README.md explicando sua função.
- **Autenticação:** Todas as rotas e acessos protegidos por autenticação.
- **Backup:** Realizar backup semanal e salvar em `backup/`.
- **Arquivos Duplicados:** ✅ Limpeza realizada em Out/2025 - removidos 33 arquivos duplicados
- **Relatórios:** Gerar relatório mensal em `docs/relatorio-mensal-AAAA-MM.md`.

## Limpeza de Duplicatas (Out/2025)
Foi realizada uma varredura completa removendo:
- **scripts/javascript/js/**: 11 arquivos idênticos aos de scripts/javascript/
- **scripts/javascript/**: Pasta completa (não utilizada em produção)
- **js/**: Pasta com arquivos stub não referenciados
- Arquivos vazios: style.css, supabase-auth-oficial.js, 6 arquivos HTML " 2.html"

**Estrutura consolidada:**
- 📁 `assets/js/` → Scripts do frontend (usados pelos arquivos HTML)
- 📁 `src/` → Código backend/React (serviços, componentes, utils)
- 📁 `api/` → Serverless functions
- ⚠️ Arquivos test-*.js na raiz são ferramentas de desenvolvimento (não removidos)

## Como contribuir
Consulte o README.md principal e os READMEs de cada módulo para instruções detalhadas.

---

> Para dúvidas, consulte a documentação em `docs/` ou entre em contato com o responsável pelo projeto.
