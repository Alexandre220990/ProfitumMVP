// ============================================================================
// SCRIPT DE DÉBOGAGE AUTHENTIFICATION - enhanced-client-documents
// ============================================================================

// Fonction pour vérifier l'état de l'authentification
function debugAuth(): void {
  console.log('🔍 === DÉBOGAGE AUTHENTIFICATION ===');
  
  // 1. Vérifier les tokens dans localStorage
  console.log('📋 1. Tokens dans localStorage:');
  const supabaseToken = localStorage.getItem('supabase_token');
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('supabase_refresh_token');
  
  console.log('   supabase_token:', supabaseToken ? `${supabaseToken.substring(0, 20)}...` : 'null');
  console.log('   token:', token ? `${token.substring(0, 20)}...` : 'null');
  console.log('   supabase_refresh_token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
  
  // 2. Vérifier la session Supabase
  console.log('\n📋 2. Session Supabase:');
  if ((window as any).supabase) {
    (window as any).supabase.auth.getSession().then(({ data, error }: any) => {
      if (error) {
        console.log('   ❌ Erreur session:', error);
      } else if (data.session) {
        console.log('   ✅ Session active:', {
          user_id: data.session.user.id,
          email: data.session.user.email,
          type: data.session.user.user_metadata?.type,
          expires_at: new Date(data.session.expires_at * 1000).toLocaleString()
        });
      } else {
        console.log('   ❌ Aucune session active');
      }
    });
  } else {
    console.log('   ❌ Supabase non disponible');
  }
  
  // 3. Vérifier l'utilisateur actuel
  console.log('\n📋 3. Utilisateur actuel:');
  if ((window as any).supabase) {
    (window as any).supabase.auth.getUser().then(({ data, error }: any) => {
      if (error) {
        console.log('   ❌ Erreur utilisateur:', error);
      } else if (data.user) {
        console.log('   ✅ Utilisateur trouvé:', {
          id: data.user.id,
          email: data.user.email,
          type: data.user.user_metadata?.type,
          username: data.user.user_metadata?.username
        });
      } else {
        console.log('   ❌ Aucun utilisateur trouvé');
      }
    });
  }
  
  // 4. Test d'une requête API
  console.log('\n📋 4. Test requête API:');
  const testApiCall = async (): Promise<void> => {
    try {
      const response = await fetch('https://profitummvp-production.up.railway.app/api/enhanced-client-documents/sections', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseToken || token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('   Status:', response.status);
      console.log('   StatusText:', response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Réponse:', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('   ❌ Erreur:', errorData);
      }
    } catch (error) {
      console.log('   ❌ Erreur réseau:', (error as Error).message);
    }
  };
  
  testApiCall();
  
  console.log('\n🔍 === FIN DÉBOGAGE ===');
}

// Fonction pour forcer le rafraîchissement de la session
async function forceRefreshSession(): Promise<void> {
  console.log('🔄 === FORCER RAFRAÎCHISSEMENT SESSION ===');
  
  if (!(window as any).supabase) {
    console.log('❌ Supabase non disponible');
    return;
  }
  
  try {
    const { data, error } = await (window as any).supabase.auth.refreshSession();
    
    if (error) {
      console.log('❌ Erreur rafraîchissement:', error);
    } else if (data.session) {
      console.log('✅ Session rafraîchie:', {
        user_id: data.session.user.id,
        email: data.session.user.email,
        expires_at: new Date(data.session.expires_at * 1000).toLocaleString()
      });
      
      // Mettre à jour localStorage
      localStorage.setItem('supabase_token', data.session.access_token);
      localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
      localStorage.setItem('token', data.session.access_token);
      
      console.log('✅ Tokens mis à jour dans localStorage');
    } else {
      console.log('❌ Aucune session après rafraîchissement');
    }
  } catch (error) {
    console.log('❌ Erreur lors du rafraîchissement:', error);
  }
  
  console.log('🔄 === FIN RAFRAÎCHISSEMENT ===');
}

// Fonction pour nettoyer les tokens
function clearTokens(): void {
  console.log('🧹 === NETTOYAGE TOKENS ===');
  
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('token');
  localStorage.removeItem('supabase_refresh_token');
  
  console.log('✅ Tokens supprimés de localStorage');
  console.log('🧹 === FIN NETTOYAGE ===');
}

// Exposer les fonctions globalement pour le débogage
(window as any).debugAuth = debugAuth;
(window as any).forceRefreshSession = forceRefreshSession;
(window as any).clearTokens = clearTokens;

// Auto-exécution si appelé directement
if (typeof window !== 'undefined') {
  console.log('🔧 Script de débogage auth chargé');
  console.log('📝 Commandes disponibles:');
  console.log('   debugAuth() - Vérifier l\'état de l\'authentification');
  console.log('   forceRefreshSession() - Forcer le rafraîchissement de la session');
  console.log('   clearTokens() - Nettoyer les tokens');
}

export { debugAuth, forceRefreshSession, clearTokens };
