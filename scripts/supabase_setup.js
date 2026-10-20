// scripts/supabase_setup.js
// Script utilitario para verificar o ejecutar mantenimiento en Supabase
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || 'https://dcatufozlsymqgeznvpk.supabase.co';
const anonKey = env.SUPABASE_ANON_KEY;

async function checkHealth() {
  console.log('[Supabase Health Check] Conectando a:', supabaseUrl);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/leads?select=id,full_name,score,temperature,status&limit=5`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`[Supabase Health Check] Éxito. Prospectos en base de datos: ${data.length}`);
    data.forEach((lead, i) => {
      console.log(`  ${i + 1}. [${lead.temperature}] ${lead.full_name} (${lead.score} pts) - Estado: ${lead.status}`);
    });
  } catch (err) {
    console.error('[Supabase Health Check] Error:', err.message);
  }
}

checkHealth();
