// 🔐 Configurações de Ambiente - Portal Médico Dr. Marcio
// Este é um arquivo template. Copie para env.js e configure suas credenciais.

// ⚠️ NUNCA COMMITE O ARQUIVO env.js NO GIT! 
// Mantenha suas credenciais seguras.

window.ENV = {
    // 🗄️ Configurações do Supabase
    SUPABASE_URL: 'https://obohdaxvawmjhxsjgikp.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ib2hkYXh2YXdtamh4c2pnaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDQzMTYsImV4cCI6MjA3MDEyMDMxNn0.Oa4GC17FfUqajBRuEDLroXIg1vBd_x6shE6ke8pKMKU',
    
    
    // 📊 Configurações do Google Sheets (opcional)
    GOOGLE_SHEETS_API_KEY: 'SUA_API_KEY_GOOGLE_AQUI',
    GOOGLE_SPREADSHEET_ID: 'SEU_SPREADSHEET_ID_AQUI',
    
    // 🌍 Configurações do ambiente
    ENVIRONMENT: 'development', // ou 'production'
    DEBUG: true
};

// 📝 Instruções:
// 1. Copie este arquivo para env.js
// 2. Substitua as credenciais pelos valores reais
// 3. Adicione env.js ao .gitignore para não commitar
