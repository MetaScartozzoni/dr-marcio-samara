
-- =============================================
-- 🚀 MIGRAÇÃO: usuarios → profiles + employees + patients
-- =============================================

-- 1. BACKUP da tabela usuarios (se existir)
CREATE TABLE IF NOT EXISTS usuarios_backup AS
SELECT * FROM usuarios;

-- 2. Migrar dados para profiles
INSERT INTO profiles (id, email, full_name, phone, date_of_birth, cpf, role, status, created_at, updated_at)
SELECT
    id,
    email,
    COALESCE(nome_completo, 'Nome não informado') as full_name,
    telefone as phone,
    data_nascimento as date_of_birth,
    cpf,
    CASE
        WHEN tipo_usuario = 'admin' THEN 'admin'
        WHEN tipo_usuario = 'medico' THEN 'doctor'
        WHEN tipo_usuario = 'funcionario' THEN 'employee'
        WHEN tipo_usuario = 'paciente' THEN 'patient'
        ELSE 'patient'
    END as role,
    CASE
        WHEN status IS NOT NULL THEN status
        ELSE 'active'
    END as status,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM usuarios
ON CONFLICT (email) DO NOTHING;

-- 3. Migrar funcionários (admin, doctor, employee) para employees
INSERT INTO employees (id, employee_type, department, specialization, hire_date, is_active)
SELECT
    p.id,
    CASE
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'doctor' THEN 'doctor'
        WHEN p.role = 'employee' THEN 'employee'
        ELSE 'employee'
    END as employee_type,
    CASE
        WHEN u.departamento IS NOT NULL THEN u.departamento
        ELSE 'Geral'
    END as department,
    CASE
        WHEN u.especializacao IS NOT NULL THEN u.especializacao
        WHEN p.role = 'doctor' THEN 'Clínico Geral'
        ELSE NULL
    END as specialization,
    COALESCE(u.data_admissao, u.created_at::date, CURRENT_DATE) as hire_date,
    CASE
        WHEN p.status = 'active' THEN true
        ELSE false
    END as is_active
FROM profiles p
LEFT JOIN usuarios u ON p.id = u.id
WHERE p.role IN ('admin', 'doctor', 'employee');

-- 4. Migrar pacientes para patients
INSERT INTO patients (id, emergency_contact_name, emergency_contact_phone, medical_record_number, blood_type, allergies)
SELECT
    p.id,
    u.contato_emergencia_nome,
    u.contato_emergencia_telefone,
    u.numero_prontuario,
    u.tipo_sanguineo,
    CASE
        WHEN u.alergias IS NOT NULL THEN string_to_array(u.alergias, ',')
        ELSE NULL
    END as allergies
FROM profiles p
LEFT JOIN usuarios u ON p.id = u.id
WHERE p.role = 'patient';

-- 5. Verificar migração
SELECT
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT
    'employees' as table_name,
    COUNT(*) as count
FROM employees
UNION ALL
SELECT
    'patients' as table_name,
    COUNT(*) as count
FROM patients;
