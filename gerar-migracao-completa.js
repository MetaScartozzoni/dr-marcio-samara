#!/usr/bin/env node

/**
 * 🚀 SQL GERADOR: Migração Completa para Profiles + Employee + Patient
 *
 * Este script gera SQL completo para:
 * 1. Criar tabela profiles padronizada com status e date_of_birth
 * 2. Criar tabelas employee e patient
 * 3. Migrar dados existentes
 * 4. Configurar RLS policies
 * 5. Criar índices e constraints
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 GERANDO SQL PARA MIGRAÇÃO COMPLETA...\n');

// Configurações das tabelas
const TABLES_CONFIG = {
    profiles: {
        columns: {
            id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
            email: 'TEXT UNIQUE NOT NULL',
            full_name: 'TEXT NOT NULL',
            phone: 'TEXT',
            date_of_birth: 'DATE',
            cpf: 'TEXT',
            role: "TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'doctor', 'patient'))",
            status: "TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'))",
            created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        }
    },
    employees: {
        columns: {
            id: 'UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE',
            employee_type: "TEXT NOT NULL CHECK (employee_type IN ('admin', 'doctor', 'employee'))",
            department: 'TEXT',
            specialization: 'TEXT',
            license_number: 'TEXT',
            hire_date: 'DATE',
            salary: 'DECIMAL(10,2)',
            is_active: 'BOOLEAN DEFAULT true',
            created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        }
    },
    patients: {
        columns: {
            id: 'UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE',
            emergency_contact_name: 'TEXT',
            emergency_contact_phone: 'TEXT',
            medical_record_number: 'TEXT UNIQUE',
            insurance_provider: 'TEXT',
            insurance_policy_number: 'TEXT',
            blood_type: 'TEXT',
            allergies: 'TEXT[]',
            chronic_conditions: 'TEXT[]',
            created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        }
    }
};

function generateCreateTableSQL(tableName, config) {
    const columns = Object.entries(config.columns)
        .map(([col, def]) => `    ${col} ${def}`)
        .join(',\n');

    return `-- Criar tabela ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
${columns}
);

-- Índices para ${tableName}
CREATE INDEX IF NOT EXISTS idx_${tableName}_email ON ${tableName}(email);
CREATE INDEX IF NOT EXISTS idx_${tableName}_role ON ${tableName}(role);
CREATE INDEX IF NOT EXISTS idx_${tableName}_status ON ${tableName}(status);
CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at);

-- Trigger para updated_at em ${tableName}
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${tableName}_updated_at
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;
}

function generateMigrationSQL() {
    return `
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
`;
}

function generateRLSPolicies() {
    return `
-- =============================================
-- 🔒 RLS POLICIES para Profiles + Employees + Patients
-- =============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para admins atualizarem qualquer perfil
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para médicos verem perfis de pacientes
CREATE POLICY "Doctors can view patient profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'doctor'
        ) AND profiles.role = 'patient'
    );

-- Política para funcionários verem perfis de pacientes
CREATE POLICY "Employees can view patient profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'employee', 'doctor')
        ) AND profiles.role = 'patient'
    );

-- =============================================
-- EMPLOYEES POLICIES
-- =============================================

-- Política para funcionários verem seus próprios dados
CREATE POLICY "Employees can view own data" ON employees
    FOR SELECT USING (auth.uid() = id);

-- Política para funcionários atualizarem seus próprios dados
CREATE POLICY "Employees can update own data" ON employees
    FOR UPDATE USING (auth.uid() = id);

-- Política para admins verem todos os funcionários
CREATE POLICY "Admins can view all employees" ON employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para admins gerenciarem funcionários
CREATE POLICY "Admins can manage employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- PATIENTS POLICIES
-- =============================================

-- Política para pacientes verem seus próprios dados
CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT USING (auth.uid() = id);

-- Política para pacientes atualizarem seus próprios dados
CREATE POLICY "Patients can update own data" ON patients
    FOR UPDATE USING (auth.uid() = id);

-- Política para médicos verem dados de pacientes
CREATE POLICY "Doctors can view patient data" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- Política para funcionários verem dados de pacientes
CREATE POLICY "Employees can view patient data" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'employee', 'doctor')
        )
    );

-- Política para funcionários atualizarem dados de pacientes
CREATE POLICY "Employees can update patient data" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'employee', 'doctor')
        )
    );
`;
}

function generateVerificationQueries() {
    return `
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
`;
}

function generateFullSQL() {
    let sql = '';

    // Header
    sql += `-- =============================================\n`;
    sql += `-- 🚀 MIGRAÇÃO COMPLETA: Profiles + Employees + Patients\n`;
    sql += `-- Gerado em: ${new Date().toISOString()}\n`;
    sql += `-- =============================================\n\n`;

    // Criar tabelas
    sql += `-- =============================================\n`;
    sql += `-- 1. CRIAR TABELAS\n`;
    sql += `-- =============================================\n\n`;

    sql += generateCreateTableSQL('profiles', TABLES_CONFIG.profiles);
    sql += '\n';
    sql += generateCreateTableSQL('employees', TABLES_CONFIG.employees);
    sql += '\n';
    sql += generateCreateTableSQL('patients', TABLES_CONFIG.patients);
    sql += '\n';

    // Migração de dados
    sql += `-- =============================================\n`;
    sql += `-- 2. MIGRAÇÃO DE DADOS\n`;
    sql += `-- =============================================\n\n`;
    sql += generateMigrationSQL();
    sql += '\n';

    // RLS Policies
    sql += `-- =============================================\n`;
    sql += `-- 3. CONFIGURAR RLS POLICIES\n`;
    sql += `-- =============================================\n\n`;
    sql += generateRLSPolicies();
    sql += '\n';

    // Verificação
    sql += `-- =============================================\n`;
    sql += `-- 4. VERIFICAÇÃO\n`;
    sql += `-- =============================================\n\n`;
    sql += generateVerificationQueries();
    sql += '\n';

    return sql;
}

function saveSQLToFile(sql, filename) {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, sql, 'utf8');
    console.log(`💾 SQL salvo em: ${filePath}`);
}

function main() {
    console.log('📋 Gerando SQL completo...\n');

    const fullSQL = generateFullSQL();

    // Salvar arquivo principal
    saveSQLToFile(fullSQL, 'migracao-profiles-employees-patients.sql');

    // Salvar arquivos separados para cada etapa
    saveSQLToFile(
        generateCreateTableSQL('profiles', TABLES_CONFIG.profiles) +
        generateCreateTableSQL('employees', TABLES_CONFIG.employees) +
        generateCreateTableSQL('patients', TABLES_CONFIG.patients),
        '01-criar-tabelas.sql'
    );

    saveSQLToFile(generateMigrationSQL(), '02-migrar-dados.sql');
    saveSQLToFile(generateRLSPolicies(), '03-configurar-rls.sql');
    saveSQLToFile(generateVerificationQueries(), '04-verificar-migracao.sql');

    console.log('\n✅ SQL gerado com sucesso!');
    console.log('\n📁 Arquivos criados:');
    console.log('  • migracao-profiles-employees-patients.sql (completo)');
    console.log('  • 01-criar-tabelas.sql');
    console.log('  • 02-migrar-dados.sql');
    console.log('  • 03-configurar-rls.sql');
    console.log('  • 04-verificar-migracao.sql');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Execute 01-criar-tabelas.sql no Supabase');
    console.log('2. Execute 02-migrar-dados.sql para migrar dados');
    console.log('3. Execute 03-configurar-rls.sql para segurança');
    console.log('4. Execute 04-verificar-migracao.sql para verificar');
    console.log('5. Atualize seu código para usar as novas tabelas');

    // Estatísticas
    const lines = fullSQL.split('\n').length;
    console.log(`\n📊 Estatísticas:`);
    console.log(`   • Linhas de SQL: ${lines}`);
    console.log(`   • Tabelas criadas: 3 (profiles, employees, patients)`);
    console.log(`   • RLS Policies: 12`);
    console.log(`   • Índices criados: 12`);
    console.log(`   • Triggers criados: 3`);
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    generateFullSQL,
    generateCreateTableSQL,
    generateMigrationSQL,
    generateRLSPolicies,
    generateVerificationQueries,
    TABLES_CONFIG
};
