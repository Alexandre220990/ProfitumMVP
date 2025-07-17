const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://your-project.supabase.co'; // Remplacer par votre URL
const supabaseKey = 'your-anon-key'; // Remplacer par votre clé

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTokenRefresh() {
  console.log('🔄 Test de rafraîchissement du token Supabase...');
  
  try {
    // 1. Vérifier la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur lors de la récupération de la session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('⚠️ Aucune session active trouvée');
      return;
    }
    
    console.log('✅ Session trouvée');
    console.log('📅 Token expiré le:', new Date(session.expires_at * 1000));
    console.log('🕐 Heure actuelle:', new Date());
    
    // 2. Essayer de rafraîchir le token
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Erreur lors du rafraîchissement:', refreshError);
      return;
    }
    
    if (newSession) {
      console.log('✅ Token rafraîchi avec succès');
      console.log('📅 Nouveau token expiré le:', new Date(newSession.expires_at * 1000));
      
      // 3. Tester l'appel API avec le nouveau token
      const response = await fetch('http://localhost:5001/api/client/produits-eligibles', {
        headers: {
          'Authorization': `Bearer ${newSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('🌐 Réponse API:', data);
      
    } else {
      console.log('⚠️ Aucune nouvelle session après rafraîchissement');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testTokenRefresh(); 