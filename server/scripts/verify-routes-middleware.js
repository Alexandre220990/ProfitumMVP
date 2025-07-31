// Script de vérification des routes et middleware
// À exécuter pour diagnostiquer les problèmes de redirection et d'authentification

const fs = require('fs');
const path = require('path');

console.log('🔍 VÉRIFICATION DES ROUTES ET MIDDLEWARE');
console.log('==========================================');

// 1. Vérification de la structure des fichiers
console.log('\n1. VÉRIFICATION DE LA STRUCTURE DES FICHIERS');

const requiredFiles = [
  'server/src/app.ts',
  'server/src/routes/index.ts',
  'server/src/routes/client.ts',
  'server/src/middleware/auth-enhanced.ts',
  'client/src/hooks/use-auth.tsx',
  'client/src/hooks/use-client-products.ts',
  'client/src/lib/api.ts'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 2. Vérification des routes client
console.log('\n2. VÉRIFICATION DES ROUTES CLIENT');

const clientRoutesPath = 'server/src/routes/client.ts';
if (fs.existsSync(clientRoutesPath)) {
  const content = fs.readFileSync(clientRoutesPath, 'utf8');
  
  // Vérifier la présence de la route produits-eligibles
  const hasProduitsEligibles = content.includes('/produits-eligibles');
  console.log(`${hasProduitsEligibles ? '✅' : '❌'} Route /produits-eligibles`);
  
  // Vérifier la présence du middleware d'authentification
  const hasAuthMiddleware = content.includes('enhancedAuthMiddleware') || content.includes('requireUserType');
  console.log(`${hasAuthMiddleware ? '✅' : '❌'} Middleware d'authentification`);
}

// 3. Vérification du middleware d'authentification
console.log('\n3. VÉRIFICATION DU MIDDLEWARE D\'AUTHENTIFICATION');

const authMiddlewarePath = 'server/src/middleware/auth-enhanced.ts';
if (fs.existsSync(authMiddlewarePath)) {
  const content = fs.readFileSync(authMiddlewarePath, 'utf8');
  
  // Vérifier la présence des logs de débogage
  const hasDebugLogs = content.includes('console.log') && content.includes('🔍');
  console.log(`${hasDebugLogs ? '✅' : '❌'} Logs de débogage ajoutés`);
  
  // Vérifier la gestion des tokens Supabase
  const hasSupabaseAuth = content.includes('supabase.auth.getUser');
  console.log(`${hasSupabaseAuth ? '✅' : '❌'} Authentification Supabase`);
  
  // Vérifier la vérification des types d'utilisateur
  const hasUserTypeCheck = content.includes('userType') && content.includes('client');
  console.log(`${hasUserTypeCheck ? '✅' : '❌'} Vérification des types d'utilisateur`);
}

// 4. Vérification du hook d'authentification côté client
console.log('\n4. VÉRIFICATION DU HOOK D\'AUTHENTIFICATION CLIENT');

const useAuthPath = 'client/src/hooks/use-auth.tsx';
if (fs.existsSync(useAuthPath)) {
  const content = fs.readFileSync(useAuthPath, 'utf8');
  
  // Vérifier la présence des logs de redirection
  const hasRedirectLogs = content.includes('🔀 Redirection utilisateur');
  console.log(`${hasRedirectLogs ? '✅' : '❌'} Logs de redirection ajoutés`);
  
  // Vérifier la logique de redirection
  const hasRedirectLogic = content.includes('navigate(\'/dashboard/client\')');
  console.log(`${hasRedirectLogic ? '✅' : '❌'} Logique de redirection`);
}

// 5. Vérification du hook des produits éligibles
console.log('\n5. VÉRIFICATION DU HOOK PRODUITS ÉLIGIBLES');

const useClientProductsPath = 'client/src/hooks/use-client-products.ts';
if (fs.existsSync(useClientProductsPath)) {
  const content = fs.readFileSync(useClientProductsPath, 'utf8');
  
  // Vérifier la présence des logs de débogage
  const hasDebugLogs = content.includes('🌐 Appel API') && content.includes('📦 Réponse API');
  console.log(`${hasDebugLogs ? '✅' : '❌'} Logs de débogage API`);
  
  // Vérifier la gestion des erreurs
  const hasErrorHandling = content.includes('err.response?.status') && content.includes('401');
  console.log(`${hasErrorHandling ? '✅' : '❌'} Gestion des erreurs`);
}

// 6. Vérification de la configuration API
console.log('\n6. VÉRIFICATION DE LA CONFIGURATION API');

const apiPath = 'client/src/lib/api.ts';
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  
  // Vérifier la configuration des intercepteurs
  const hasInterceptors = content.includes('interceptors.request') && content.includes('interceptors.response');
  console.log(`${hasInterceptors ? '✅' : '❌'} Intercepteurs Axios`);
  
  // Vérifier la gestion des tokens Supabase
  const hasSupabaseToken = content.includes('supabase_token') && content.includes('localStorage');
  console.log(`${hasSupabaseToken ? '✅' : '❌'} Gestion des tokens Supabase`);
  
  // Vérifier la gestion des erreurs 401
  const has401Handling = content.includes('401') && content.includes('refreshSession');
  console.log(`${has401Handling ? '✅' : '❌'} Gestion des erreurs 401`);
}

// 7. Vérification de la configuration CORS
console.log('\n7. VÉRIFICATION DE LA CONFIGURATION CORS');

const corsPath = 'server/src/config/cors.ts';
if (fs.existsSync(corsPath)) {
  const content = fs.readFileSync(corsPath, 'utf8');
  
  // Vérifier la configuration des origines autorisées
  const hasAllowedOrigins = content.includes('allowedOrigins') && content.includes('profitum.app');
  console.log(`${hasAllowedOrigins ? '✅' : '❌'} Origines autorisées`);
  
  // Vérifier la configuration des credentials
  const hasCredentials = content.includes('credentials: true');
  console.log(`${hasCredentials ? '✅' : '❌'} Configuration credentials`);
}

// 8. Recommandations
console.log('\n8. RECOMMANDATIONS');

const recommendations = [
  '✅ Exécuter le script SQL pour vérifier la base de données',
  '✅ Vérifier les logs du serveur pour les erreurs d\'authentification',
  '✅ Tester la connexion avec un utilisateur client',
  '✅ Vérifier que les tokens Supabase sont bien stockés',
  '✅ Contrôler les redirections dans la console du navigateur'
];

recommendations.forEach(rec => {
  console.log(rec);
});

console.log('\n🔍 VÉRIFICATION TERMINÉE');
console.log('Exécutez le script SQL pour une analyse complète de la base de données.'); 