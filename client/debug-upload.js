// Script de debug pour tester l'upload de documents TICPE
console.log('🔍 DEBUG: Test d\'upload de documents TICPE');

// Test 1: Vérifier la configuration
console.log('📋 Configuration API:', {
  API_URL: window.config?.API_URL || 'Non défini',
  SUPABASE_URL: window.config?.SUPABASE_URL || 'Non défini'
});

// Test 2: Vérifier l'authentification
console.log('🔐 Authentification:', {
  token: localStorage.getItem('token') ? 'Présent' : 'Absent',
  supabase_token: localStorage.getItem('supabase_token') ? 'Présent' : 'Absent',
  user: window.user || 'Non défini'
});

// Test 3: Fonction de test d'upload
async function testUpload() {
  console.log('🧪 Test d\'upload...');
  
  try {
    // Créer un fichier de test
    const testFile = new File(['Test content'], 'test.pdf', { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('dossier_id', '93374842-cca6-4873-b16e-0ada92e97004');
    formData.append('document_type', 'kbis');
    formData.append('category', 'eligibilite_ticpe');
    formData.append('description', 'Test upload debug');
    formData.append('user_type', 'client');
    
    const token = localStorage.getItem('token');
    
    console.log('📡 Envoi requête...');
    const response = await fetch('https://profitummvp-production.up.railway.app/api/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    console.log('📊 Réponse:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Succès:', result);
    }
    
  } catch (error) {
    console.error('❌ Erreur test upload:', error);
  }
}

// Exposer la fonction de test
window.testUpload = testUpload;
console.log('✅ Script de debug chargé. Utilisez testUpload() pour tester l\'upload.');
