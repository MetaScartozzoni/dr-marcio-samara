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
- **Arquivos Duplicados:** Auditoria e limpeza regular para evitar duplicidade.
- **Relatórios:** Gerar relatório mensal em `docs/relatorio-mensal-AAAA-MM.md`.

## Como contribuir
Consulte o README.md principal e os READMEs de cada módulo para instruções detalhadas.

---

> Para dúvidas, consulte a documentação em `docs/` ou entre em contato com o responsável pelo projeto.
