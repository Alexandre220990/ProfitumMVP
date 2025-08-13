const express = require('express');
const { registerRoutes } = require('./routes');

// Créer une app Express de test
const app = express();
app.use(express.json());

// Monter les routes
registerRoutes(app);

// Test des routes
console.log('🔍 Routes montées:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`Router: ${middleware.regexp}`);
  }
});

console.log('\n✅ Test des routes terminé');
