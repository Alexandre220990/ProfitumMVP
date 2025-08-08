const fs = require('fs');
const path = require('path');

// Configuration des guides
const guides = [
  'guide-bienvenue',
  'guide-dashboard', 
  'guide-marketplace',
  'guide-agenda',
  'guide-documents',
  'guide-simulation',
  'guide-profil',
  'guide-notifications',
  'guide-support'
];

console.log('🚀 Script d\'upload des guides vers Supabase');
console.log('=============================================\n');

console.log('📋 Guides à uploader :');
guides.forEach((guide, index) => {
  console.log(`   ${index + 1}. ${guide}.md`);
});

console.log('\n📝 Instructions pour upload manuel :');
console.log('=====================================');
console.log('1. Allez dans votre dashboard Supabase');
console.log('2. Naviguez vers Storage > Buckets > formation');
console.log('3. Cliquez sur "Upload files"');
console.log('4. Sélectionnez les fichiers suivants :\n');

// Lister les chemins des fichiers
guides.forEach(guide => {
  const filePath = path.join(__dirname, `../docs/guides/${guide}.md`);
  if (fs.existsSync(filePath)) {
    console.log(`   📄 ${filePath}`);
  } else {
    console.log(`   ❌ ${filePath} (fichier manquant)`);
  }
});

console.log('\n💡 Alternative - Upload via l\'interface web :');
console.log('==============================================');
console.log('1. Ouvrez https://supabase.com/dashboard');
console.log('2. Sélectionnez votre projet');
console.log('3. Allez dans Storage > Buckets');
console.log('4. Cliquez sur le bucket "formation"');
console.log('5. Cliquez sur "Upload files"');
console.log('6. Glissez-déposez tous les fichiers .md de docs/guides/');

console.log('\n🎯 Pour convertir en PDF plus tard :');
console.log('=====================================');
console.log('1. Téléchargez les fichiers .md depuis Supabase');
console.log('2. Ouvrez-les dans un éditeur Markdown (VS Code, Typora, etc.)');
console.log('3. Utilisez "Export to PDF" ou "Print to PDF"');
console.log('4. Re-uploadez les fichiers PDF dans le bucket');

console.log('\n✅ Script terminé !');
