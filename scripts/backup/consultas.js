const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function backupConsultas() {
  const { data, error } = await supabase.from('consultas').select('*');
  if (error) {
    console.error('Erro ao buscar consultas:', error);
    process.exit(1);
  }
  fs.writeFileSync('consultas-backup.json', JSON.stringify(data, null, 2));
  console.log('Backup de consultas realizado com sucesso!');
}

backupConsultas();