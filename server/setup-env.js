#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration de l\'environnement Supabase...\n');

// Vérifier si le fichier .env existe déjà
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  Le fichier .env existe déjà.');
  console.log('Voulez-vous le remplacer ? (y/N)');
  
  // En mode non-interactif, on ne remplace pas
  console.log('Pour remplacer manuellement, supprimez le fichier .env et relancez ce script.\n');
  process.exit(0);
}

// Template du fichier .env
const envTemplate = `# Configuration Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_KEY=your_anon_key_here

# Configuration du serveur
PORT=3001
NODE_ENV=development

# Configuration CORS
CORS_ORIGIN=http://localhost:3000

# Configuration JWT
JWT_SECRET=your_jwt_secret_here

# Configuration des logs
LOG_LEVEL=debug
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Fichier .env créé avec succès !');
  console.log('\n📝 Instructions :');
  console.log('1. Ouvrez le fichier .env dans le dossier server/');
  console.log('2. Remplacez les valeurs "your_*_here" par vos vraies clés Supabase :');
  console.log('   - SUPABASE_URL : URL de votre projet Supabase');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY : Clé service role (admin)');
  console.log('   - SUPABASE_KEY : Clé anonyme (publique)');
  console.log('   - JWT_SECRET : Clé secrète pour les tokens JWT');
  console.log('\n🔑 Pour obtenir vos clés Supabase :');
  console.log('1. Allez sur https://supabase.com/dashboard');
  console.log('2. Sélectionnez votre projet');
  console.log('3. Allez dans Settings > API');
  console.log('4. Copiez les clés nécessaires');
  console.log('\n🚀 Une fois configuré, lancez : npm run dev');
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env:', error.message);
  process.exit(1);
} 