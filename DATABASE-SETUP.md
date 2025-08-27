# 🏥 Portal Dr. Márcio - Database Setup Guide

## 📋 Prerequisites
- Supabase account and project
- Access to Supabase Dashboard

## 🚀 Setup Steps

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Navigate to **SQL Editor**

### 2. Execute Schema Files
Execute the following files in order:

#### A. Main Schema
1. Open `supabase-schema.sql`
2. Copy the entire content
3. Paste in Supabase SQL Editor
4. Click **Run**

#### B. Security Policies
1. Open `supabase-rls-policies.sql`
2. Copy the entire content
3. Paste in Supabase SQL Editor
4. Click **Run**

#### C. Initial Data
Execute this SQL manually in the SQL Editor:

```sql
-- Insert default specialties
INSERT INTO especialidades (nome, descricao) VALUES
('Cirurgia Plástica', 'Especialidade em cirurgia plástica e estética'),
('Dermatologia', 'Especialidade em doenças da pele'),
('Oftalmologia', 'Especialidade em doenças dos olhos'),
('Ortopedia', 'Especialidade em sistema musculoesquelético'),
('Cardiologia', 'Especialidade em doenças do coração'),
('Ginecologia', 'Especialidade em saúde da mulher');

-- Insert default system settings
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
('clinica_nome', 'Portal Dr. Márcio', 'string', 'Nome da clínica'),
('clinica_telefone', '(11) 99999-9999', 'string', 'Telefone da clínica'),
('clinica_email', 'contato@portaldrmarcio.com', 'string', 'Email da clínica'),
('clinica_endereco', 'Rua das Clínicas, 123 - São Paulo/SP', 'string', 'Endereço da clínica'),
('horario_funcionamento', 'Seg-Sex: 8h-18h, Sáb: 8h-12h', 'string', 'Horário de funcionamento'),
('valor_consulta_padrao', '150.00', 'decimal', 'Valor padrão da consulta'),
('dias_antecedencia_agendamento', '30', 'integer', 'Dias de antecedência para agendamento');
```

### 3. Verify Setup
After executing all scripts, verify in Supabase Dashboard:

- ✅ **Tables Created**: Check that all tables exist in **Table Editor**
- ✅ **Policies Active**: Go to **Authentication > Policies** to verify RLS policies
- ✅ **Initial Data**: Check that specialties and settings were inserted

### 4. Test the Application
1. Make sure your React app is running: `npm start`
2. Visit `http://localhost:3000`
3. Try creating a user account
4. Test login functionality

## 🔐 User Roles

The system supports three user roles:

- **Paciente**: Can view own appointments, medical records, and financial data
- **Funcionário**: Can manage patients, appointments, and medical records
- **Admin**: Full system access including user management and settings

### Creating an Admin User

After creating a user account through the app:

```sql
-- Replace 'admin@example.com' with the actual email
UPDATE usuarios SET tipo_usuario = 'admin' WHERE email = 'admin@example.com';
```

## 🛠 Troubleshooting

### Common Issues:

1. **"relation 'public.usuarios' does not exist"**
   - Make sure you executed the schema file first
   - Check for any SQL errors in the schema execution

2. **Authentication not working**
   - Verify your `.env` file has correct Supabase credentials
   - Check that RLS policies are active

3. **Permission denied errors**
   - Ensure RLS policies are correctly applied
   - Check user roles in the usuarios table

### Getting Help:
- Check Supabase logs in the Dashboard
- Verify all tables and policies exist
- Test with a simple query first

## 📚 Next Steps

Once the database is set up:

1. **Test Authentication**: Create user accounts and test login
2. **Migrate HTML Pages**: Convert existing HTML panels to React components
3. **Implement Features**: Add appointment scheduling, medical records, etc.
4. **Add Real-time Features**: Implement live updates for appointments

## 🔒 Security Notes

- All patient data is protected by Row Level Security
- Users can only access their own data (unless they're staff/admin)
- Audit trail tracks all data access and modifications
- Authentication is handled securely through Supabase Auth

---

**🎉 Your medical portal database is now ready!**
