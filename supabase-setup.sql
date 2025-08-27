-- Setup Script for Supabase Database
-- Execute these commands in order in your Supabase SQL Editor

-- =============================================
-- 1. First, execute the schema file
-- =============================================
-- Copy and paste the contents of supabase-schema.sql here

-- =============================================
-- 2. Then execute the RLS policies
-- =============================================
-- Copy and paste the contents of supabase-rls-policies.sql here

-- =============================================
-- 3. Finally, add some initial data
-- =============================================

-- Insert default specialties
INSERT INTO public.especialidades (nome, descricao) VALUES
('Cirurgia Plástica', 'Especialidade em cirurgia plástica e estética'),
('Dermatologia', 'Especialidade em doenças da pele'),
('Oftalmologia', 'Especialidade em doenças dos olhos'),
('Ortopedia', 'Especialidade em sistema musculoesquelético'),
('Cardiologia', 'Especialidade em doenças do coração'),
('Ginecologia', 'Especialidade em saúde da mulher');

-- Insert default system settings
INSERT INTO public.configuracoes (chave, valor, tipo, descricao) VALUES
('clinica_nome', 'Portal Dr. Márcio', 'string', 'Nome da clínica'),
('clinica_telefone', '(11) 99999-9999', 'string', 'Telefone da clínica'),
('clinica_email', 'contato@portaldrmarcio.com', 'string', 'Email da clínica'),
('clinica_endereco', 'Rua das Clínicas, 123 - São Paulo/SP', 'string', 'Endereço da clínica'),
('horario_funcionamento', 'Seg-Sex: 8h-18h, Sáb: 8h-12h', 'string', 'Horário de funcionamento'),
('valor_consulta_padrao', '150.00', 'decimal', 'Valor padrão da consulta'),
('dias_antecedencia_agendamento', '30', 'integer', 'Dias de antecedência para agendamento');

-- =============================================
-- 4. Create a test admin user (optional)
-- =============================================
-- After creating a user account through the app, you can manually set them as admin:
-- UPDATE public.usuarios SET tipo_usuario = 'admin' WHERE email = 'your-admin-email@example.com';

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Your database is now ready for the React application.
-- The app should be running at http://localhost:3000
