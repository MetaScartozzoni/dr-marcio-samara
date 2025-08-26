# 📡 API Endpoints - Portal Dr. Marcio

## 🎯 **Estrutura de API:**

### **1. Autenticação (/api/auth/):**
- `POST /api/auth/login` - Login de usuários
- `POST /api/auth/register` - Cadastro de usuários  
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Redefinir senha

### **2. Usuários (/api/users/):**
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users/list` - Listar usuários (admin)
- `PUT /api/users/{id}/status` - Ativar/desativar usuário

### **3. Agendamentos (/api/appointments/):**
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/{id}` - Atualizar agendamento
- `DELETE /api/appointments/{id}` - Cancelar agendamento
- `GET /api/appointments/available-slots` - Horários disponíveis

### **4. Prontuários (/api/records/):**
- `GET /api/records` - Listar prontuários
- `POST /api/records` - Criar prontuário
- `PUT /api/records/{id}` - Atualizar prontuário
- `GET /api/records/{id}/history` - Histórico do prontuário

### **5. Caderno Digital (/api/notebook/):**
- `GET /api/notebook` - Listar anotações
- `POST /api/notebook` - Criar anotação
- `PUT /api/notebook/{id}` - Atualizar anotação
- `DELETE /api/notebook/{id}` - Excluir anotação

### **6. Integrações (/api/integrations/):**
- `POST /api/integrations/google-calendar` - Sincronizar Google Calendar
- `POST /api/integrations/whatsapp` - Enviar mensagem WhatsApp
- `POST /api/integrations/email` - Enviar email

## 🔗 **Implementação:**
- Todas as APIs são implementadas como **Edge Functions** no Supabase
- Autenticação via JWT tokens
- Rate limiting implementado
- Logs de auditoria para todas as operações
