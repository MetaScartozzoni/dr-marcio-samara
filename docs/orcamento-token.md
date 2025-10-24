# Token do Orçamento (Cartão / Caderno Digital)

Visão geral
- O sistema pode gerar tokens opcionais para um orçamento. Esses tokens representam o "cartão" do paciente.
- O raw token é retornado APENAS UMA VEZ ao ser criado. No banco é armazenado somente o HMAC-SHA256 do token.
- Quando o paciente apresenta o token (QR/NFC), o frontend envia o token ao backend para desbloquear dados sensíveis do orçamento/prontuário.

Endpoints
- POST /api/orcamentos/:id/token
  - Autorização: Bearer token (usuário admin/staff)
  - Corpo (opcional): { "expiresInMinutes": 60 }
  - Retorna: { token: "<raw_token>", token_expires_at, ... } — observe: token aparece apenas nesta resposta

- DELETE /api/orcamentos/:id/token
  - Revoga e apaga o token do orçamento.

- GET /api/orcamentos/:id?show_sensitive=true&token=<token>
  - Se token válido for apresentado, dados sensíveis são desmascarados conforme escopo. Caso contrário, retornam mascarados.

Variáveis de ambiente necessárias
- SAMARA_TOKEN_SECRET (obrigatório) — GUARDAR NO GITHUB SECRETS
- REDIS_URL (para BullMQ; se ausente, fila usará fallback table-based)
- S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (para armazenar PDFs)
- SENDGRID_API_KEY / TWILIO_* / SMTP_* (opcional, para notificações)

Observações de segurança
- Raw token é mostrado só uma vez; mantenha-o seguro. Se o paciente perder o cartão/token, revogue com DELETE /api/orcamentos/:id/token
- Auditoria: recomendamos registrar criação/uso/revogação no sistema de logs/auditoria.
