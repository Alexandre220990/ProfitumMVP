// Diagnostic des données frontend pour l'API calendrier
console.log('🔍 Diagnostic des données frontend...');

// 1. Intercepter les appels fetch pour voir les données envoyées
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Intercepter seulement les appels à l'API calendrier
  if (url.includes('/api/calendar/events') && options?.method === 'POST') {
    console.log('📤 Données envoyées par le frontend:');
    console.log('- URL:', url);
    console.log('- Method:', options.method);
    console.log('- Headers:', options.headers);
    
    try {
      const body = JSON.parse(options.body);
      console.log('- Body:', body);
      
      // Vérifier les champs requis
      const requiredFields = ['title', 'start_date', 'end_date', 'type'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Champs manquants:', missingFields);
      } else {
        console.log('✅ Tous les champs requis sont présents');
      }
      
      // Vérifier le format des dates
      if (body.start_date) {
        console.log('- start_date format:', typeof body.start_date, body.start_date);
        console.log('- start_date valide:', !isNaN(new Date(body.start_date).getTime()));
      }
      
      if (body.end_date) {
        console.log('- end_date format:', typeof body.end_date, body.end_date);
        console.log('- end_date valide:', !isNaN(new Date(body.end_date).getTime()));
      }
      
      // Vérifier les champs problématiques
      if (body.created_by) {
        console.warn('⚠️ created_by envoyé depuis le frontend:', body.created_by);
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing body:', error);
    }
  }
  
  return originalFetch.apply(this, args);
};

// 2. Intercepter les réponses pour voir les erreurs
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url.includes('/api/calendar/events') && options?.method === 'POST') {
    return originalFetch.apply(this, args).then(response => {
      if (!response.ok) {
        console.log('📥 Réponse d\'erreur reçue:');
        console.log('- Status:', response.status);
        console.log('- StatusText:', response.statusText);
        
        // Cloner la réponse pour pouvoir la lire
        response.clone().json().then(data => {
          console.log('- Error data:', data);
        }).catch(error => {
          console.log('- Error parsing response:', error);
        });
      } else {
        console.log('✅ Réponse réussie reçue');
        response.clone().json().then(data => {
          console.log('- Success data:', data);
        }).catch(error => {
          console.log('- Success response (non-JSON):', response.statusText);
        });
      }
      return response;
    });
  }
  
  return originalFetch.apply(this, args);
};

// 3. Surveiller les mutations React Query
console.log('🔍 Surveillance des mutations React Query...');

// Intercepter les mutations React Query
const originalMutation = window.__REACT_QUERY_MUTATION__;
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.renderers) {
    const renderer = hook.renderers.get(1);
    if (renderer) {
      console.log('✅ React DevTools détecté');
    }
  }
}

// 4. Surveiller les événements de clic sur TOUS les boutons
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target.tagName === 'BUTTON' || target.closest('button')) {
    const button = target.tagName === 'BUTTON' ? target : target.closest('button');
    const buttonText = button.textContent?.trim();
    
    console.log('🖱️ Bouton cliqué:', buttonText);
    console.log('- Button element:', button);
    console.log('- Button type:', button.type);
    console.log('- Form parent:', button.closest('form'));
    
    // Attendre un peu pour voir si une requête est déclenchée
    setTimeout(() => {
      console.log('⏰ Vérification après clic sur:', buttonText);
    }, 100);
  }
});

// 5. Surveiller les changements dans les champs de formulaire
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea, select') : [];
          inputs.forEach(input => {
            input.addEventListener('change', (e) => {
              console.log('📝 Champ modifié:', {
                name: e.target.name,
                value: e.target.value,
                type: e.target.type
              });
            });
          });
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 6. Vérifier le token d'authentification
console.log('🔐 Vérification du token d\'authentification...');
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');

console.log('- Token présent:', !!token);
console.log('- Supabase token présent:', !!supabaseToken);
if (token) {
  console.log('- Token length:', token.length);
  console.log('- Token preview:', token.substring(0, 20) + '...');
}

// 7. Surveiller les erreurs globales
window.addEventListener('error', (e) => {
  if (e.message.includes('calendar') || e.message.includes('event')) {
    console.error('🚨 Erreur JavaScript liée au calendrier:', e);
  }
});

console.log('🔍 Diagnostic configuré. Cliquez sur "Mettre à jour" pour voir les détails...');



