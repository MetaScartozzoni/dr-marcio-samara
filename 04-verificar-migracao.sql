
-- =============================================
-- ✅ VERIFICAÇÃO DA MIGRAÇÃO
-- =============================================

-- 1. Verificar estrutura das tabelas
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('profiles', 'employees', 'patients')
ORDER BY tablename;

-- 2. Verificar colunas das tabelas
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'employees', 'patients')
ORDER BY table_name, ordinal_position;

-- 3. Contagem de registros por tabela
SELECT
    'profiles' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
    SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END) as doctors,
    SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
    SUM(CASE WHEN role = 'patient' THEN 1 ELSE 0 END) as patients
FROM profiles
UNION ALL
SELECT
    'employees' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN employee_type = 'admin' THEN 1 ELSE 0 END) as admins,
    SUM(CASE WHEN employee_type = 'doctor' THEN 1 ELSE 0 END) as doctors,
    SUM(CASE WHEN employee_type = 'employee' THEN 1 ELSE 0 END) as employees,
    0 as patients
FROM employees
UNION ALL
SELECT
    'patients' as table_name,
    COUNT(*) as total_records,
    0 as admins,
    0 as doctors,
    0 as employees,
    COUNT(*) as patients
FROM patients;

-- 4. Verificar integridade referencial
SELECT
    p.id,
    p.full_name,
    p.role,
    p.status,
    CASE
        WHEN p.role IN ('admin', 'doctor', 'employee') THEN
            CASE WHEN e.id IS NOT NULL THEN 'OK' ELSE 'MISSING EMPLOYEE' END
        ELSE 'N/A'
    END as employee_status,
    CASE
        WHEN p.role = 'patient' THEN
            CASE WHEN pt.id IS NOT NULL THEN 'OK' ELSE 'MISSING PATIENT' END
        ELSE 'N/A'
    END as patient_status
FROM profiles p
LEFT JOIN employees e ON p.id = e.id
LEFT JOIN patients pt ON p.id = pt.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 5. Verificar RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('profiles', 'employees', 'patients')
ORDER BY tablename, policyname;
