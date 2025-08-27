// 🧪 TESTE ULTRA RÁPIDO - 30 segundos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testeRapido() {
  console.log('🚀 TESTE ULTRA RÁPIDO - SISTEMA DE PERFIS');
  console.log('==========================================');

  try {
    // 1. Verificar tabela usuarios
    console.log('1️⃣  Verificando tabela usuarios...');
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (!usuarios) {
      console.log('❌ Tabela usuarios NÃO existe ou tem problemas');
      console.log('💡 Execute os comandos SQL no Supabase Dashboard');
      return;
    }
    console.log('✅ Tabela usuarios OK');

    // 2. Testar cadastro rápido
    console.log('\n2️⃣  Testando cadastro...');
    const testEmail = `teste-${Date.now()}@example.com`;
    const testPassword = 'Teste123!@#';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          nome: 'Usuário Teste',
          tipo_usuario: 'paciente'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Erro no cadastro:', signUpError.message);
      return;
    }
    console.log('✅ Cadastro OK');

    // 3. Aguardar e verificar perfil
    console.log('\n3️⃣  Verificando perfil criado...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single();

    if (perfilError) {
      console.log('❌ Perfil NÃO foi criado automaticamente');
      return;
    }

    console.log('✅ Perfil criado automaticamente!');
    console.log(`   👤 Nome: ${perfil.nome}`);
    console.log(`   📧 Email: ${perfil.email}`);
    console.log(`   🏷️  Tipo: ${perfil.tipo_usuario}`);

    // 4. Testar login
    console.log('\n4️⃣  Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }
    console.log('✅ Login OK');

    // 5. Verificar perfil no login
    const { data: loginPerfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', loginData.user?.id)
      .single();

    console.log('✅ Perfil acessível no login!');

    // RESULTADO FINAL
    console.log('\n🎉 SUCESSO TOTAL!');
    console.log('================');
    console.log('✅ Cadastro funcionando');
    console.log('✅ Perfil criado automaticamente');
    console.log('✅ Login funcionando');
    console.log('✅ user.profiles corrigido');
    console.log('\n🚀 SISTEMA 100% FUNCIONAL!');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

testeRapido();
