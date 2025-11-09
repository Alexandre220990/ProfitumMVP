#!/usr/bin/env node

/**
 * Script d'escalade des notifications selon le SLA défini.
 *
 * Usage :
 *   node server/scripts/run-notification-escalations.cjs
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS'
  }
});

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Exécution NotificationEscalationService             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const { NotificationEscalationService } = require('../src/services/NotificationEscalationService');

  await NotificationEscalationService.run();

  console.log('\n✅ Escalade terminée.\n');
}

main().catch((error) => {
  console.error('❌ Erreur lors de l’escalade des notifications:', error);
  process.exit(1);
});


