// ============================================================================
// SCRIPT DE CRÉATION D'APPORTEUR VIA API
// ============================================================================
// Ce script utilise l'API pour créer des apporteurs d'affaires

const API_URL = process.env.API_URL || 'https://profitummvp-production.up.railway.app';

// Données de test pour créer un apporteur
const apporteurData = {
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@test.com',
    phone: '0123456789',
    company_name: 'Conseil Dupont',
    company_type: 'SARL',
    sector: 'Conseil & Audit',
    siren: '123456789',
    motivation_letter: 'Je souhaite devenir apporteur d\'affaires chez Profitum car j\'ai une grande expérience dans le conseil aux entreprises et je souhaite aider mes clients à accéder aux aides financières disponibles.',
    sponsor_code: '', // Code de parrainage optionnel
    accept_terms: true,
    accept_privacy: true,
    accept_commission: true
};

// Fonction pour créer un apporteur via l'API
async function createApporteur() {
    try {
        console.log('🚀 Création d\'un apporteur d\'affaires...');
        
        // Créer un FormData pour l'upload de fichier
        const formData = new FormData();
        
        // Ajouter les données du formulaire
        Object.keys(apporteurData).forEach(key => {
            formData.append(key, apporteurData[key]);
        });
        
        // Simuler un fichier CV (en réalité, vous devriez avoir un vrai fichier)
        const cvBlob = new Blob(['CV simulé'], { type: 'application/pdf' });
        formData.append('cv_file', cvBlob, 'cv-jean-dupont.pdf');
        
        const response = await fetch(`${API_URL}/api/apporteur/register`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Apporteur créé avec succès !');
            console.log('📋 Détails:', {
                candidature_id: result.data.candidature_id,
                status: result.data.status,
                next_steps: result.data.next_steps
            });
        } else {
            console.error('❌ Erreur lors de la création:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Fonction pour vérifier le code de parrainage
async function verifySponsorCode(code) {
    try {
        console.log(`🔍 Vérification du code de parrainage: ${code}`);
        
        const response = await fetch(`${API_URL}/api/apporteur/verify-sponsor/${code}`);
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Code de parrainage valide !');
            console.log('👤 Parrain:', result.data.sponsor_name);
            console.log('🏢 Entreprise:', result.data.company_name);
        } else {
            console.log('❌ Code de parrainage invalide:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Fonction pour lister les candidatures (nécessite authentification admin)
async function listCandidatures() {
    try {
        console.log('📋 Récupération des candidatures...');
        
        // Note: Cette fonction nécessite un token d'authentification admin
        const response = await fetch(`${API_URL}/api/admin/apporteur-candidatures`, {
            headers: {
                'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Candidatures récupérées !');
            console.log('📊 Nombre de candidatures:', result.data.length);
            result.data.forEach((candidature, index) => {
                console.log(`${index + 1}. ${candidature.first_name} ${candidature.last_name} - ${candidature.status}`);
            });
        } else {
            console.error('❌ Erreur lors de la récupération:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter les fonctions
console.log('🎯 Script de création d\'apporteur d\'affaires');
console.log('==============================================');

// Créer un apporteur
createApporteur();

// Vérifier un code de parrainage (exemple)
setTimeout(() => {
    verifySponsorCode('AFF123456');
}, 2000);

// Lister les candidatures (nécessite un token admin valide)
// setTimeout(() => {
//     listCandidatures();
// }, 4000);
