// 🔐 Configurações de Ambiente - Portal Médico Dr. Marcio
// Arquivo de configuração das credenciais

window.ENV = {
    // 🗄️ Configurações do Supabase
    // VOCÊ PRECISA SUBSTITUIR ESTAS CREDENCIAIS PELAS SUAS REAIS
    SUPABASE_URL: 'https://obohdaxvawmjhxsjgikp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib2hkYXh2YXdtamh4c2pnaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDQzMTYsImV4cCI6MjA3MDEyMDMxNn0.Oa4GC17FfUqajBRuEDLroXIg1vBd_x6shE6ke8pKMKU',
    
    // 📊 Configurações do Google Sheets (opcional)
    GOOGLE_SHEETS_API_KEY: '',
    GOOGLE_SPREADSHEET_ID: '',
    
    // 🌍 Configurações do ambiente
    ENVIRONMENT: 'development',
    DEBUG: true
};

// ⚠️ IMPORTANTE: Substitua as credenciais acima pelos valores reais do seu projeto Supabase
// Como obter suas credenciais:
// 1. Acesse https://supabase.com/dashboard
// 2. Selecione seu projeto
// 3. Vá em Settings > API
// 4. Copie a URL do projeto e a chave anônima (anon key)
