const fetch = require('node-fetch');

async function testCalculsPrecis() {
  console.log('🧮 Test des nouvelles règles de calcul précises\n');

  const tests = [
    {
      name: 'Transport avec consommation carburant précise',
      messages: [
        "Je suis dans le transport",
        "J'ai 3 poids lourds et 2 véhicules légers",
        "Je consomme 45 000 litres de carburant par an",
        "J'ai 8 employés",
        "Mon CA est de 1,2 millions d'euros",
        "Montrez-moi les résultats"
      ],
      expected: {
        TICPE: 7650, // 45000 * 0.17
        URSSAF: 5600, // 8 * 35000 * 0.02
        DFS: 7056 // 8 * 0.7 * 2500 * 12 * 0.10 * 0.42
      }
    },
    {
      name: 'BTP avec propriété de locaux',
      messages: [
        "Je suis dans le BTP",
        "J'ai 12 employés",
        "Je suis propriétaire de mes locaux",
        "Ma taxe foncière est de 8 000 euros",
        "Mon CA est de 800 000 euros",
        "Montrez-moi les résultats"
      ],
      expected: {
        FONCIER: 2400, // 8000 * 0.30
        URSSAF: 8400, // 12 * 35000 * 0.02
        DFS: 10584 // 12 * 0.7 * 2500 * 12 * 0.10 * 0.42
      }
    },
    {
      name: 'Commerce avec consommation énergie',
      messages: [
        "Je suis dans le commerce",
        "J'ai 6 employés",
        "Je consomme 120 000 kWh d'électricité par an",
        "Mon CA est de 500 000 euros",
        "Montrez-moi les résultats"
      ],
      expected: {
        ENERGIE: 3600, // 120000 * 0.03
        URSSAF: 4200, // 6 * 35000 * 0.02
        DFS: 5292 // 6 * 0.7 * 2500 * 12 * 0.10 * 0.42
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log('─'.repeat(50));

    const clientId = `test-${Date.now()}`;
    let history = [];

    for (let i = 0; i < test.messages.length; i++) {
      const message = test.messages[i];
      console.log(`📤 Message ${i + 1}: ${message}`);
      
      try {
        const response = await fetch('http://localhost:5001/api/chatbot/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            message,
            history
          })
        });

        const data = await response.json();
        
        if (data.conversation_complete && data.produits_eligibles) {
          console.log(`✅ Résultats obtenus:`);
          data.produits_eligibles.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.nom}: ${product.gainPotentiel}€`);
            
            // Vérifier si le calcul correspond à l'attendu
            const expected = test.expected[product.id];
            if (expected) {
              const difference = Math.abs(product.gainPotentiel - expected);
              const tolerance = expected * 0.1; // 10% de tolérance
              if (difference <= tolerance) {
                console.log(`    ✅ Calcul correct (attendu: ${expected}€)`);
              } else {
                console.log(`    ❌ Calcul incorrect (attendu: ${expected}€, obtenu: ${product.gainPotentiel}€)`);
              }
            }
          });
          
          const totalGain = data.produits_eligibles.reduce((sum, p) => sum + p.gainPotentiel, 0);
          console.log(`💰 Gain total: ${totalGain}€`);
        }

        // Mettre à jour l'historique
        history.push({
          role: 'user',
          content: message,
          timestamp: new Date()
        });
        
        history.push({
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        });

        // Attendre un peu entre les messages
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error('❌ Erreur:', error.message);
      }
    }
  }

  console.log('\n✅ Tests terminés !');
}

// Lancer les tests
testCalculsPrecis().catch(console.error); 