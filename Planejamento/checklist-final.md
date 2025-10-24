# Checklist Final para Amanhã

## Objetivo
Garantir que o aplicativo esteja operacional e acessível para o cliente até 25 de outubro de 2025.

## Diagnóstico Atual
- Serviços no mesmo projeto? ✔⃣ (confirmado via diagrama de arquitetura)
- Rede privada ativa? ❌ (verificar e habilitar para cada serviço)
- Variáveis com referências? ❌ (ajustar para usar `RAILWAY_PRIVATE_DOMAIN`, `DATABASE_URL` etc.)
- Build e deploy concluídos? ❌ (verificar logs)
- Aplicação acessível via domínio público? ❌ (testar URL)
- Servidor Replit ligado e página inicial carrega? ✔⃣ (conforme doc `VISAO_OPERACIONAL_VS_JORNADA.md`)
- Rota `/teste-seguranca.html` funcional? ❌ (testar a página de segurança)

## Checklist
| Tarefa | Status | Observações breves |
|---|---|---|
| Serviços no mesmo projeto | ✅ | Confirmado via diagrama de arquitetura |
| Rede privada ativa | ☐ | Ativar Private Networking em cada serviço |
| Variáveis atualizadas | ☐ | Usar variáveis de referência |
| Build e deploy | ☐ | Revisar logs de build/deploy |
| Teste de acesso ao domínio | ☐ | Testar domínio público e funcionalidades |
| Página inicial carrega (Replit) | ✅ | Servidor está ligado e página inicial já carrega |
| Teste /teste-seguranca.html | ☐ | Adicionar `/teste-seguranca.html` no final da URL e verificar página |

## Plano de Ação
1. Ativar rede privada em todos os serviços.
2. Revisar variáveis de ambiente para usar referências.
3. Executar novo deploy e verificar logs.
4. Testar a aplicação no domínio público (domínio gerado pela Railway ou customizado).
5. Verificar que a página inicial carrega no servidor Replit.
6. Adicionar `/teste-seguranca.html` no final da URL e testar a página de segurança.
7. Agendar teste com o cliente e recolher feedback.
