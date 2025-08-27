
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
