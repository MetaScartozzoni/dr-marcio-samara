-- Row Level Security Policies for Portal Dr. Márcio
-- Simplified and corrected version

-- =============================================
-- USUARIOS (Users) POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "users_view_own" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "admins_view_all_users" ON public.usuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- =============================================
-- PACIENTES (Patients) POLICIES
-- =============================================

-- Patients can view their own records
CREATE POLICY "patients_view_own" ON public.pacientes
    FOR SELECT USING (usuario_id = auth.uid());

-- Patients can update their own records
CREATE POLICY "patients_update_own" ON public.pacientes
    FOR UPDATE USING (usuario_id = auth.uid());

-- Staff can view all patients
CREATE POLICY "staff_view_all_patients" ON public.pacientes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- Staff can manage all patients
CREATE POLICY "staff_manage_all_patients" ON public.pacientes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- =============================================
-- AGENDAMENTOS (Appointments) POLICIES
-- =============================================

-- Patients can view their own appointments
CREATE POLICY "patients_view_own_appointments" ON public.agendamentos
    FOR SELECT USING (
        paciente_id IN (SELECT id FROM public.pacientes WHERE usuario_id = auth.uid())
    );

-- Patients can create appointments
CREATE POLICY "patients_create_appointments" ON public.agendamentos
    FOR INSERT WITH CHECK (
        paciente_id IN (SELECT id FROM public.pacientes WHERE usuario_id = auth.uid())
    );

-- Staff can view all appointments
CREATE POLICY "staff_view_all_appointments" ON public.agendamentos
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- Staff can manage all appointments
CREATE POLICY "staff_manage_all_appointments" ON public.agendamentos
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- =============================================
-- PRONTUARIOS (Medical Records) POLICIES
-- =============================================

-- Patients can view their own medical records
CREATE POLICY "patients_view_own_records" ON public.prontuarios
    FOR SELECT USING (
        paciente_id IN (SELECT id FROM public.pacientes WHERE usuario_id = auth.uid())
    );

-- Staff can view all medical records
CREATE POLICY "staff_view_all_records" ON public.prontuarios
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- Only staff can create medical records
CREATE POLICY "staff_create_records" ON public.prontuarios
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- Only staff can update medical records
CREATE POLICY "staff_update_records" ON public.prontuarios
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- =============================================
-- EXAMES (Medical Exams) POLICIES
-- =============================================

-- Patients can view their own exams
CREATE POLICY "patients_view_own_exams" ON public.exames
    FOR SELECT USING (
        prontuario_id IN (
            SELECT id FROM public.prontuarios
            WHERE paciente_id IN (SELECT id FROM public.pacientes WHERE usuario_id = auth.uid())
        )
    );

-- Staff can manage all exams
CREATE POLICY "staff_manage_exams" ON public.exames
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- =============================================
-- FINANCEIRO (Financial) POLICIES
-- =============================================

-- Patients can view their own financial records
CREATE POLICY "patients_view_own_financial" ON public.financeiro
    FOR SELECT USING (
        paciente_id IN (SELECT id FROM public.pacientes WHERE usuario_id = auth.uid())
    );

-- Only staff can manage financial records
CREATE POLICY "staff_manage_financial" ON public.financeiro
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- =============================================
-- CONFIGURACOES (Settings) POLICIES
-- =============================================

-- Only admins can manage system settings
CREATE POLICY "admins_manage_settings" ON public.configuracoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario = 'admin')
    );

-- =============================================
-- AUDITORIA (Audit) POLICIES
-- =============================================

-- Users can view their own audit trail
CREATE POLICY "users_view_own_audit" ON public.auditoria
    FOR SELECT USING (usuario_id = auth.uid());

-- Staff can view all audit trails
CREATE POLICY "staff_view_all_audit" ON public.auditoria
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo_usuario IN ('funcionario', 'admin'))
    );

-- System can insert audit records
CREATE POLICY "system_insert_audit" ON public.auditoria
    FOR INSERT WITH CHECK (true);
