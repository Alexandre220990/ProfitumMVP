const fetch = require('node-fetch');

async function testChatbot() {
  const baseUrl = 'http://localhost:5001';
  
  try {
    // Test 1: Message initial
    console.log('🧪 Test 1: Message initial');
    const response1 = await fetch(`${baseUrl}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'test123',
        message: 'dans le transport de marchandises',
        history: []
      })
    });
    
    const data1 = await response1.json();
    console.log('✅ Réponse 1:', data1.reply.substring(0, 100) + '...');
    console.log('📊 Phase:', data1.phase);
    console.log('📊 Conversation complète:', data1.conversation_complete);
    
    // Test 2: Ajouter des informations
    console.log('\n🧪 Test 2: Ajouter des informations');
    const history = [
      { role: 'user', content: 'dans le transport de marchandises', timestamp: new Date() },
      { role: 'assistant', content: data1.reply, timestamp: new Date() }
    ];
    
    const response2 = await fetch(`${baseUrl}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'test123',
        message: '15 employés, 10 millions d\'euros, 10 camions +7,5 tonnes',
        history: history
      })
    });
    
    const data2 = await response2.json();
    console.log('✅ Réponse 2:', data2.reply.substring(0, 100) + '...');
    console.log('📊 Phase:', data2.phase);
    console.log('📊 Conversation complète:', data2.conversation_complete);
    
    // Test 3: Demander les résultats
    console.log('\n🧪 Test 3: Demander les résultats');
    const history2 = [
      ...history,
      { role: 'user', content: '15 employés, 10 millions d\'euros, 10 camions +7,5 tonnes', timestamp: new Date() },
      { role: 'assistant', content: data2.reply, timestamp: new Date() }
    ];
    
    const response3 = await fetch(`${baseUrl}/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'test123',
        message: 'je veux voir la simulation',
        history: history2
      })
    });
    
    const data3 = await response3.json();
    console.log('✅ Réponse 3:', data3.reply.substring(0, 100) + '...');
    console.log('📊 Phase:', data3.phase);
    console.log('📊 Conversation complète:', data3.conversation_complete);
    console.log('📊 Produits éligibles:', data3.produits_eligibles?.length || 0);
    
    if (data3.produits_eligibles && data3.produits_eligibles.length > 0) {
      console.log('🎉 SUCCÈS: Produits éligibles générés !');
      data3.produits_eligibles.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.nom} - ${p.gainPotentiel}€`);
      });
    } else {
      console.log('❌ ÉCHEC: Aucun produit éligible généré');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testChatbot(); 