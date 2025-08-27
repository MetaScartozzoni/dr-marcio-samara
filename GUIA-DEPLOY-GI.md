# Guia de Deploy para Gi - Portal Dr. Marcio

## Ambientes Disponíveis

Olá Gi! O Portal Dr. Marcio possui três ambientes diferentes:

1. **QA (Quality Assurance)** - Ambiente de Teste
   - Para testar novas funcionalidades
   - Pode conter bugs e instabilidades
   - URL: https://qa.drmarcio.site

2. **Staging (Homologação)** - Ambiente de Pré-Produção
   - Para validação final antes de ir para produção
   - Deve ser estável, com dados similares à produção
   - URL: https://staging.drmarcio.site

3. **Produção** - Ambiente Final
   - Para uso dos usuários reais
   - Totalmente estável e otimizado
   - URL: https://drmarcio.site

## Como Fazer Deploy

### Para o ambiente de QA:

```bash
# Executar no terminal
npm run deploy:qa
```

### Para o ambiente de Staging:

```bash
# Executar no terminal
npm run deploy:staging
```

### Para o ambiente de Produção:

```bash
# Executar no terminal
npm run deploy:prod
```

## O que testar em cada ambiente

### QA (Teste):
- Novas funcionalidades
- Correções de bugs
- Experimentos e testes de usabilidade

### Staging (Homologação):
- Fluxo completo de uso
- Performance e segurança
- Validação com stakeholders

### Produção:
- Monitoramento de uso real
- Comportamento em escala
- Experiência do usuário final

## Contatos para Suporte

Se encontrar problemas em qualquer ambiente:

- Email: suporte@drmarcio.site
- Telefone: (11) 99999-9999

## Lembretes Importantes

1. **Sempre teste em QA antes** de enviar para Staging
2. **Sempre teste em Staging antes** de enviar para Produção
3. **Nunca faça alterações diretamente** em Produção
4. Mantenha um registro de todas as mudanças feitas

Boa sorte com os deploys! 🚀
