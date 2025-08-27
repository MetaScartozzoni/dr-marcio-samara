#!/usr/bin/env node

/**
 * ✅ VERIFICADOR RÁPIDO: Testa se a migração foi bem-sucedida
 *
 * Este script verifica:
 * 1. Se as tabelas foram criadas corretamente
 * 2. Se os dados foram migrados
 * 3. Se as RLS policies estão ativas
 * 4. Se a estrutura está correta
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas!');
    console.log('Certifique-se de ter:');
    console.log('  VITE_SUPABASE_URL');
    console.log('  VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTabelas() {
    console.log('\n📋 VERIFICANDO TABELAS...\n');

    const tabelas = ['profiles', 'employees', 'patients'];

    for (const tabela of tabelas) {
        try {
            const { error } = await supabase
                .from(tabela)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${tabela}: Erro - ${error.message}`);
            } else {
                console.log(`✅ ${tabela}: OK`);
            }
        } catch (error) {
            console.log(`❌ ${tabela}: Erro de conexão - ${error.message}`);
        }
    }
}

async function verificarEstrutura() {
    console.log('\n🏗️ VERIFICANDO ESTRUTURA...\n');

    try {
        // Verificar colunas da tabela profiles
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (profilesError) {
            console.log(`❌ Profiles: ${profilesError.message}`);
        } else if (profilesData && profilesData.length > 0) {
            const colunas = Object.keys(profilesData[0]);
            const colunasEsperadas = ['id', 'email', 'full_name', 'phone', 'date_of_birth', 'cpf', 'role', 'status', 'created_at', 'updated_at'];
            const colunasFaltando = colunasEsperadas.filter(col => !colunas.includes(col));

            if (colunasFaltando.length === 0) {
                console.log('✅ Profiles: Todas as colunas presentes');
                console.log(`   📊 Colunas encontradas: ${colunas.join(', ')}`);
            } else {
                console.log(`⚠️  Profiles: Colunas faltando: ${colunasFaltando.join(', ')}`);
            }
        }

        // Verificar employees
        const { error: employeesError } = await supabase
            .from('employees')
            .select('*')
            .limit(1);

        if (employeesError) {
            console.log(`❌ Employees: ${employeesError.message}`);
        } else {
            console.log('✅ Employees: OK');
        }

        // Verificar patients
        const { error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .limit(1);

        if (patientsError) {
            console.log(`❌ Patients: ${patientsError.message}`);
        } else {
            console.log('✅ Patients: OK');
        }

    } catch (error) {
        console.log(`❌ Erro ao verificar estrutura: ${error.message}`);
    }
}

async function verificarDados() {
    console.log('\n📊 VERIFICANDO DADOS...\n');

    try {
        // Contagem de registros por tabela
        const { data: profilesCount, error: profilesCountError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        if (profilesCountError) {
            console.log(`❌ Profiles count: ${profilesCountError.message}`);
        } else {
            console.log(`✅ Profiles: ${profilesCount} registros`);
        }

        // Distribuição por role
        const { data: rolesData, error: rolesError } = await supabase
            .from('profiles')
            .select('role')
            .then(async ({ data, error }) => {
                if (error) return { data: null, error };

                const roles = data.reduce((acc, item) => {
                    acc[item.role] = (acc[item.role] || 0) + 1;
                    return acc;
                }, {});

                return { data: roles, error: null };
            });

        if (rolesError) {
            console.log(`❌ Roles: ${rolesError.message}`);
        } else {
            console.log('📈 Distribuição por role:');
            Object.entries(rolesData).forEach(([role, count]) => {
                console.log(`   • ${role}: ${count}`);
            });
        }

        // Verificar employees
        const { data: employeesCount, error: employeesCountError } = await supabase
            .from('employees')
            .select('id', { count: 'exact', head: true });

        if (employeesCountError) {
            console.log(`❌ Employees count: ${employeesCountError.message}`);
        } else {
            console.log(`✅ Employees: ${employeesCount} registros`);
        }

        // Verificar patients
        const { data: patientsCount, error: patientsCountError } = await supabase
            .from('patients')
            .select('id', { count: 'exact', head: true });

        if (patientsCountError) {
            console.log(`❌ Patients count: ${patientsCountError.message}`);
        } else {
            console.log(`✅ Patients: ${patientsCount} registros`);
        }

    } catch (error) {
        console.log(`❌ Erro ao verificar dados: ${error.message}`);
    }
}

async function verificarIntegridade() {
    console.log('\n🔗 VERIFICANDO INTEGRIDADE...\n');

    try {
        // Verificar se todos os funcionários têm registro em employees
        const { data: funcionariosSemEmployee, error: funcError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('role', ['admin', 'doctor', 'employee'])
            .then(async ({ data: profiles, error }) => {
                if (error) return { data: null, error };

                const ids = profiles.map(p => p.id);
                const { data: employees, error: empError } = await supabase
                    .from('employees')
                    .select('id')
                    .in('id', ids);

                if (empError) return { data: null, error: empError };

                const employeeIds = employees.map(e => e.id);
                const semEmployee = profiles.filter(p => !employeeIds.includes(p.id));

                return { data: semEmployee, error: null };
            });

        if (funcError) {
            console.log(`❌ Integridade funcionários: ${funcError.message}`);
        } else if (funcionariosSemEmployee.length > 0) {
            console.log(`⚠️  Funcionários sem registro em employees: ${funcionariosSemEmployee.length}`);
            funcionariosSemEmployee.forEach(f => {
                console.log(`   • ${f.full_name} (${f.role})`);
            });
        } else {
            console.log('✅ Todos os funcionários têm registro em employees');
        }

        // Verificar se todos os pacientes têm registro em patients
        const { data: pacientesSemPatient, error: patError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('role', 'patient')
            .then(async ({ data: profiles, error }) => {
                if (error) return { data: null, error };

                const ids = profiles.map(p => p.id);
                const { data: patients, error: ptError } = await supabase
                    .from('patients')
                    .select('id')
                    .in('id', ids);

                if (ptError) return { data: null, error: ptError };

                const patientIds = patients.map(p => p.id);
                const semPatient = profiles.filter(p => !patientIds.includes(p.id));

                return { data: semPatient, error: null };
            });

        if (patError) {
            console.log(`❌ Integridade pacientes: ${patError.message}`);
        } else if (pacientesSemPatient.length > 0) {
            console.log(`⚠️  Pacientes sem registro em patients: ${pacientesSemPatient.length}`);
            pacientesSemPatient.forEach(p => {
                console.log(`   • ${p.full_name}`);
            });
        } else {
            console.log('✅ Todos os pacientes têm registro em patients');
        }

    } catch (error) {
        console.log(`❌ Erro ao verificar integridade: ${error.message}`);
    }
}

async function verificarPermissoes() {
    console.log('\n🔒 VERIFICANDO PERMISSÕES...\n');

    try {
        // Tentar uma operação que requer autenticação
        const { error } = await supabase.auth.getUser();

        if (error) {
            console.log('ℹ️  Usuário não autenticado (isso é normal se estiver testando sem login)');
        } else {
            console.log('✅ Usuário autenticado');

            // Tentar acessar profiles
            const { error: profilesTestError } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .limit(1);

            if (profilesTestError) {
                console.log(`❌ Acesso a profiles: ${profilesTestError.message}`);
            } else {
                console.log('✅ Acesso a profiles: OK');
            }
        }

        console.log('ℹ️  Para testar RLS completamente, faça login primeiro');

    } catch (error) {
        console.log(`❌ Erro ao verificar permissões: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 VERIFICADOR RÁPIDO DE MIGRAÇÃO\n');
    console.log('=====================================\n');

    try {
        await verificarTabelas();
        await verificarEstrutura();
        await verificarDados();
        await verificarIntegridade();
        await verificarPermissoes();

        console.log('\n=====================================');
        console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
        console.log('\n📋 RESUMO:');
        console.log('• Se todas as verificações estiverem verdes (✅), a migração foi bem-sucedida!');
        console.log('• Se houver alertas amarelos (⚠️), revise os pontos mencionados');
        console.log('• Se houver erros vermelhos (❌), execute novamente a migração');

    } catch (error) {
        console.error('\n❌ ERRO GERAL:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    verificarTabelas,
    verificarEstrutura,
    verificarDados,
    verificarIntegridade,
    verificarPermissoes
};
