# 🚀 GUIA DE EXECUÇÃO: Migração Profiles + Employees + Patients

## 📋 **VISÃO GERAL DA MIGRAÇÃO**

Este guia implementa uma estrutura de banco de dados otimizada com:

### 🏗️ **ESTRUTURA FINAL**
- **`profiles`** - Tabela principal com todos os usuários
- **`employees`** - Dados específicos de funcionários (admin, doctor, employee)
- **`patients`** - Dados específicos de pacientes

### 🎯 **ROLES DEFINIDOS**
- **`admin`** - Administradores do sistema
- **`doctor`** - Médicos
- **`employee`** - Funcionários gerais
- **`patient`** - Pacientes

---

## 📁 **ARQUIVOS GERADOS**

| Arquivo | Descrição | Quando Executar |
|---------|-----------|-----------------|
| `01-criar-tabelas.sql` | Cria as 3 tabelas com índices e triggers | Primeiro |
| `02-migrar-dados.sql` | Migra dados de `usuarios` para as novas tabelas | Segundo |
| `03-configurar-rls.sql` | Configura políticas de segurança RLS | Terceiro |
| `04-verificar-migracao.sql` | Verifica se tudo foi migrado corretamente | Último |

---

## 🚀 **PASSO A PASSO DA EXECUÇÃO**

### **PASSO 1: Criar as Tabelas**
```bash
# 1. Abra o Supabase Dashboard
# 2. Vá para SQL Editor
# 3. Execute o conteúdo do arquivo 01-criar-tabelas.sql
```

**O que será criado:**
- ✅ Tabela `profiles` com colunas `status` e `date_of_birth`
- ✅ Tabela `employees` para funcionários
- ✅ Tabela `patients` para pacientes
- ✅ Índices de performance
- ✅ Triggers de `updated_at`

### **PASSO 2: Migrar os Dados**
```bash
# Execute o conteúdo do arquivo 02-migrar-dados.sql
```

**O que acontecerá:**
- ✅ Backup da tabela `usuarios` (se existir)
- ✅ Migração de dados para `profiles`
- ✅ Criação de registros em `employees` para funcionários
- ✅ Criação de registros em `patients` para pacientes

### **PASSO 3: Configurar Segurança**
```bash
# Execute o conteúdo do arquivo 03-configurar-rls.sql
```

**O que será configurado:**
- ✅ Row Level Security (RLS) habilitado
- ✅ 12 políticas de acesso baseadas em roles
- ✅ Controle de permissões por tipo de usuário

### **PASSO 4: Verificar Migração**
```bash
# Execute o conteúdo do arquivo 04-verificar-migracao.sql
```

**O que será verificado:**
- ✅ Estrutura das tabelas
- ✅ Contagem de registros
- ✅ Integridade referencial
- ✅ Políticas RLS ativas

---

## 🔧 **ESTRUTURA DAS TABELAS**

### **Profiles** (Tabela Principal)
```sql
profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,           -- ✅ Nova coluna
    cpf TEXT,
    role TEXT NOT NULL,           -- admin, employee, doctor, patient
    status TEXT NOT NULL,         -- ✅ Nova coluna: active, inactive, pending
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### **Employees** (Funcionários)
```sql
employees (
    id UUID PRIMARY KEY REFERENCES profiles(id),
    employee_type TEXT NOT NULL,  -- admin, doctor, employee
    department TEXT,
    specialization TEXT,
    license_number TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### **Patients** (Pacientes)
```sql
patients (
    id UUID PRIMARY KEY REFERENCES profiles(id),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_record_number TEXT UNIQUE,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    blood_type TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

---

## 🔒 **PERMISSÕES POR ROLE**

### **Admin**
- ✅ Pode ver todos os perfis
- ✅ Pode editar todos os perfis
- ✅ Pode gerenciar funcionários
- ✅ Pode ver dados de pacientes

### **Doctor**
- ✅ Pode ver seu próprio perfil
- ✅ Pode ver perfis de pacientes
- ✅ Pode ver dados de pacientes
- ✅ Pode editar dados de pacientes

### **Employee**
- ✅ Pode ver seu próprio perfil
- ✅ Pode ver perfis de pacientes
- ✅ Pode ver dados de pacientes
- ✅ Pode editar dados de pacientes

### **Patient**
- ✅ Pode ver seu próprio perfil
- ✅ Pode editar seu próprio perfil
- ✅ Pode ver seus próprios dados médicos

---

## 📊 **EXEMPLO DE QUERIES APÓS MIGRAÇÃO**

### **Buscar perfil completo de um usuário:**
```sql
SELECT
    p.*,
    CASE
        WHEN p.role IN ('admin', 'doctor', 'employee') THEN
            json_build_object(
                'employee_type', e.employee_type,
                'department', e.department,
                'specialization', e.specialization
            )
        ELSE NULL
    END as employee_data,
    CASE
        WHEN p.role = 'patient' THEN
            json_build_object(
                'emergency_contact', pt.emergency_contact_name,
                'medical_record', pt.medical_record_number,
                'blood_type', pt.blood_type
            )
        ELSE NULL
    END as patient_data
FROM profiles p
LEFT JOIN employees e ON p.id = e.id
LEFT JOIN patients pt ON p.id = pt.id
WHERE p.id = $1;
```

### **Listar funcionários por departamento:**
```sql
SELECT
    p.full_name,
    p.email,
    p.role,
    e.employee_type,
    e.department,
    e.specialization,
    e.hire_date
FROM profiles p
JOIN employees e ON p.id = e.id
WHERE p.status = 'active'
ORDER BY e.department, p.full_name;
```

### **Buscar pacientes de um médico:**
```sql
SELECT
    p.full_name,
    p.phone,
    p.date_of_birth,
    pt.medical_record_number,
    pt.blood_type,
    pt.allergies
FROM profiles p
JOIN patients pt ON p.id = pt.id
WHERE p.status = 'active'
ORDER BY p.full_name;
```

---

## ⚠️ **PONTOS DE ATENÇÃO**

### **Antes da Migração:**
- [ ] Faça backup do banco de dados
- [ ] Teste em ambiente de desenvolvimento primeiro
- [ ] Verifique se não há processos críticos rodando

### **Durante a Migração:**
- [ ] Execute os scripts em ordem
- [ ] Monitore os logs de execução
- [ ] Verifique as contagens de registros

### **Após a Migração:**
- [ ] Atualize seu código para usar as novas tabelas
- [ ] Teste todas as funcionalidades
- [ ] Atualize documentação

---

## 🔄 **ROLLBACK (se necessário)**

Se algo der errado, você pode restaurar usando:

```sql
-- Restaurar tabela usuarios do backup
DROP TABLE IF EXISTS usuarios;
ALTER TABLE usuarios_backup RENAME TO usuarios;

-- Remover novas tabelas
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS profiles;
```

---

## 📞 **SUPORTE**

Após executar a migração:
1. Use `04-verificar-migracao.sql` para confirmar tudo está OK
2. Atualize seu código seguindo o `GUIA-MIGRACAO-CODIGO.md`
3. Teste as funcionalidades críticas (login, perfil, permissões)

**🎉 Sua estrutura de banco está pronta para escala e manutenção!**
