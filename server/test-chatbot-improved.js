const fetch = require('node-fetch');

async function testChatbot() {
  console.log('🧪 Test du chatbot avec le nouveau prompt optimisé\n');

  const clientId = 'test-client-123';
  const messages = [
    "Bonjour, je souhaite identifier mes opportunités d'optimisation fiscale",
    "Je suis dans le secteur du transport",
    "J'ai 5 poids lourds et 3 véhicules légers",
    "Je consomme environ 50 000 litres de carburant par an",
    "J'ai 15 employés",
    "Mon chiffre d'affaires est de 2 millions d'euros",
    "Je suis propriétaire de mes locaux",
    "Montrez-moi les résultats de l'analyse"
  ];

  let history = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\n📤 Message ${i + 1}: ${message}`);
    
    try {
      const response = await fetch('http://localhost:3001/api/chatbot/message', {
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
      
      console.log(`🤖 Réponse: ${data.reply.substring(0, 200)}...`);
      console.log(`📊 Phase: ${data.phase}`);
      console.log(`✅ Conversation complète: ${data.conversation_complete}`);
      
      if (data.produits_eligibles && data.produits_eligibles.length > 0) {
        console.log(`🎯 Produits éligibles trouvés: ${data.produits_eligibles.length}`);
        data.produits_eligibles.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.nom} - Gain estimé: ${product.gainPotentiel}€`);
        });
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
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }

  console.log('\n✅ Test terminé !');
}

// Lancer le test
testChatbot().catch(console.error); 