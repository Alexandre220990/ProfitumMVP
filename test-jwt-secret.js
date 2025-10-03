#!/usr/bin/env node

/**
 * Test avec le Legacy JWT Secret
 */

import jwt from 'jsonwebtoken';

// Legacy JWT Secret de Railway
const LEGACY_JWT_SECRET = '+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS/JCOuzxG6/dnAp86jDjQKdWsJBCI7dR3p4I+hP70+aA7g+ZZcqSrRA==';

console.log('🔍 TEST JWT SECRET');
console.log('==================');
console.log('Legacy JWT Secret:', LEGACY_JWT_SECRET.substring(0, 20) + '...');

try {
  // Test génération token (simulation)
  const testPayload = {
    id: '10705490-5e3b-49a2-a0db-8e3d5a5af38e',
    email: 'conseilprofitum@gmail.com',
    type: 'apporteur_affaires',
    database_id: '10705490-5e3b-49a2-a0db-8e3d5a5af38e'
  };

  console.log('\n🔍 Test génération token avec Legacy JWT Secret...');
  
  const token = jwt.sign(testPayload, LEGACY_JWT_SECRET, { expiresIn: '24h' });
  
  console.log('✅ Token généré avec succès:');
  console.log('   - Token:', token.substring(0, 50) + '...');
  
  // Test vérification token
  console.log('\n🔍 Test vérification token...');
  
  const decoded = jwt.verify(token, LEGACY_JWT_SECRET);
  
  console.log('✅ Token vérifié avec succès:');
  console.log('   - ID:', decoded.id);
  console.log('   - Email:', decoded.email);
  console.log('   - Type:', decoded.type);
  console.log('   - Database ID:', decoded.database_id);
  
  console.log('\n✅ RÉSUMÉ');
  console.log('==========');
  console.log('✅ Legacy JWT Secret fonctionne');
  console.log('✅ Génération token OK');
  console.log('✅ Vérification token OK');
  console.log('✅ Prêt pour Railway');
  
} catch (error) {
  console.error('❌ Erreur JWT:', error.message);
}
