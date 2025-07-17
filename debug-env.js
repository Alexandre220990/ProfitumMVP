import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger le .env à la racine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 Diagnostic des variables d\'environnement Supabase...\n');

console.log('📁 Chemin du fichier .env:', path.resolve(__dirname, '.env'));
console.log('');

console.log('🔑 Variables Supabase:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('');

console.log('📏 Longueurs des clés:');
console.log('SUPABASE_KEY length:', process.env.SUPABASE_KEY?.length || 0);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
console.log('');

console.log('🔍 Format des clés:');
if (process.env.SUPABASE_KEY) {
  console.log('SUPABASE_KEY starts with:', process.env.SUPABASE_KEY.substring(0, 20));
  console.log('SUPABASE_KEY ends with:', process.env.SUPABASE_KEY.substring(process.env.SUPABASE_KEY.length - 20));
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20));
  console.log('SERVICE_ROLE_KEY ends with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 20));
} 