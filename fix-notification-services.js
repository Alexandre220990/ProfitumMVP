const fs = require('fs');

// Liste des fichiers à corriger
const files = [
  'server/src/services/ticpe-notification-service.ts',
  'server/src/services/urssaf-notification-service.ts',
  'server/src/services/billing-service.ts',
  'server/src/services/calendar-reminder-service.ts',
  'server/src/services/crm-service.ts',
  'server/src/routes/calendar.ts'
];

// Fonction pour corriger les appels sendSystemNotification
function fixNotificationCalls(content) {
  // Remplacer les appels avec 4 paramètres par des appels avec objet
  return content.replace(
    /NotificationService\.sendSystemNotification\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*(\{[^}]+\})\s*\)/g,
    'NotificationService.sendSystemNotification({\n      user_id: $1,\n      title: $2,\n      message: $3,\n      type: \'system\',\n      ...$4\n    })'
  );
}

// Corriger chaque fichier
files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Correction de ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    const fixedContent = fixNotificationCalls(content);
    fs.writeFileSync(file, fixedContent);
    console.log(`✅ ${file} corrigé`);
  } else {
    console.log(`❌ ${file} non trouvé`);
  }
});

console.log('🎉 Correction terminée !');
