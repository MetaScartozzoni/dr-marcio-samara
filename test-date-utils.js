// 🧪 Teste da função date-utils
// Script simples para testar a conectividade e funcionalidades básicas

async function testarDateUtils() {
  console.log('🧪 Iniciando teste da função date-utils...\n');

  try {
    // Teste 1: Formatação básica
    console.log('1. Testando formatação básica...');
    const dataTeste = new Date().toISOString();
    const resultadoFormatacao = await window.DateUtilsClient.format(dataTeste, 'DD/MM/YYYY');
    console.log('✅ Formatação:', resultadoFormatacao);

    // Teste 2: Validação de data
    console.log('2. Testando validação de data...');
    const resultadoValidacao = await window.DateUtilsClient.isValid('2024-08-27');
    console.log('✅ Validação:', resultadoValidacao);

    // Teste 3: Cálculo de idade
    console.log('3. Testando cálculo de idade...');
    const resultadoIdade = await window.DateUtilsClient.age('1990-05-15');
    console.log('✅ Idade:', resultadoIdade.age, 'anos');

    // Teste 4: Horário comercial
    console.log('4. Testando horário comercial...');
    const resultadoHorario = await window.DateUtilsClient.workingHours();
    console.log('✅ Horário comercial:', resultadoHorario.isWorking ? 'Aberto' : 'Fechado');

    console.log('\n🎉 Todos os testes passaram! A função date-utils está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.log('\n🔧 Verifique:');
    console.log('1. Se a função foi implantada no Supabase');
    console.log('2. Se a URL está correta no config.js');
    console.log('3. Se há conectividade com o Supabase');
  }
}

// Executar teste automaticamente se estiver em ambiente de desenvolvimento
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Pequeno delay para garantir que tudo esteja carregado
  setTimeout(() => {
    testarDateUtils();
  }, 1000);
}

// Exportar função para uso manual
window.testarDateUtils = testarDateUtils;
