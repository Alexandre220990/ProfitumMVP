const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Défini' : '❌ Manquant');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Défini' : '❌ Manquant');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Données des experts
const experts = [
  {
    email: 'jean.dupont@cabinet-fiscal-plus.fr',
    password: 'Expert123!',
    name: 'Jean Dupont',
    company_name: 'Cabinet Fiscal Plus',
    siren: '123456789',
    specializations: ['TICPE', 'URSSAF'],
    experience: '15 ans d\'expérience en optimisation fiscale et sociale',
    location: 'Paris',
    rating: 4.8,
    compensation: 18.5,
    description: 'Expert reconnu en optimisation fiscale avec une expertise particulière en TICPE et URSSAF. Plus de 200 dossiers traités avec succès.',
    abonnement: 'scale'
  },
  {
    email: 'marie.laurent@social-experts.fr',
    password: 'Expert123!',
    name: 'Marie Laurent',
    company_name: 'Social Experts',
    siren: '987654321',
    specializations: ['DFS', 'Foncier'],
    experience: '12 ans d\'expérience en fiscalité et optimisation sociale',
    location: 'Lyon',
    rating: 4.9,
    compensation: 22.0,
    description: 'Spécialiste des questions fiscales et sociales, expert en DFS et optimisation foncière. Accompagnement personnalisé et résultats garantis.',
    abonnement: 'scale'
  },
  {
    email: 'pierre.martin@cabinet-martin-associes.fr',
    password: 'Expert123!',
    name: 'Pierre Martin',
    company_name: 'Cabinet Martin & Associés',
    siren: '456789123',
    specializations: ['CEE', 'Optimisation Énergie'],
    experience: '10 ans d\'expérience en crédits d\'impôts et optimisations énergétiques',
    location: 'Marseille',
    rating: 4.7,
    compensation: 16.5,
    description: 'Expert en crédits d\'impôts et optimisations énergétiques. Spécialiste des certificats d\'économies d\'énergie et de l\'optimisation des contrats.',
    abonnement: 'growth'
  },
  {
    email: 'sophie.dubois@dubois-consulting.fr',
    password: 'Expert123!',
    name: 'Sophie Dubois',
    company_name: 'Dubois Consulting',
    siren: '789123456',
    specializations: ['TICPE', 'CEE', 'DFS'],
    experience: '18 ans d\'expérience en fiscalité et optimisation',
    location: 'Bordeaux',
    rating: 4.9,
    compensation: 25.0,
    description: 'Consultante senior en fiscalité et optimisation. Expertise complète en TICPE, CEE et DFS. Plus de 500 dossiers traités.',
    abonnement: 'scale'
  },
  {
    email: 'thomas.bernard@bernard-social.fr',
    password: 'Expert123!',
    name: 'Thomas Bernard',
    company_name: 'Bernard Social',
    siren: '321654987',
    specializations: ['URSSAF', 'MSA'],
    experience: '8 ans d\'expérience en fiscalité sociale et optimisations',
    location: 'Lille',
    rating: 4.6,
    compensation: 14.5,
    description: 'Expert en fiscalité sociale et optimisations URSSAF et MSA. Accompagnement des entreprises agricoles et commerciales.',
    abonnement: 'growth'
  },
  {
    email: 'anne.roussel@cabinet-roussel.fr',
    password: 'Expert123!',
    name: 'Anne Roussel',
    company_name: 'Cabinet Roussel',
    siren: '654321987',
    specializations: ['Foncier', 'DFS'],
    experience: '11 ans d\'expérience en fiscalité foncière',
    location: 'Nantes',
    rating: 4.5,
    compensation: 19.0,
    description: 'Spécialiste en fiscalité foncière et DFS. Expertise particulière pour les investisseurs immobiliers et les entreprises.',
    abonnement: 'growth'
  },
  {
    email: 'luc.moreau@moreau-energie.fr',
    password: 'Expert123!',
    name: 'Luc Moreau',
    company_name: 'Moreau Énergie',
    siren: '147258369',
    specializations: ['Optimisation Énergie', 'CEE'],
    experience: '13 ans d\'expérience en optimisation énergétique',
    location: 'Toulouse',
    rating: 4.8,
    compensation: 21.5,
    description: 'Expert en optimisation énergétique et certificats d\'économies d\'énergie. Accompagnement des entreprises dans leur transition énergétique.',
    abonnement: 'scale'
  },
  {
    email: 'camille.leroy@leroy-fiscal.fr',
    password: 'Expert123!',
    name: 'Camille Leroy',
    company_name: 'Leroy Fiscal',
    siren: '963852741',
    specializations: ['TICPE', 'DFS', 'URSSAF'],
    experience: '16 ans d\'expérience en fiscalité et optimisation',
    location: 'Strasbourg',
    rating: 4.7,
    compensation: 23.0,
    description: 'Expert polyvalent en fiscalité et optimisation. Spécialiste TICPE, DFS et URSSAF. Accompagnement complet des entreprises.',
    abonnement: 'scale'
  },
  {
    email: 'julie.petit@petit-agricole.fr',
    password: 'Expert123!',
    name: 'Julie Petit',
    company_name: 'Petit Agricole',
    siren: '852963741',
    specializations: ['MSA', 'Foncier'],
    experience: '9 ans d\'expérience en secteur agricole',
    location: 'Dijon',
    rating: 4.4,
    compensation: 17.5,
    description: 'Spécialiste du secteur agricole et de l\'optimisation MSA. Expertise en fiscalité foncière pour les exploitants agricoles.',
    abonnement: 'starter'
  },
  {
    email: 'marc.durand@durand-eco.fr',
    password: 'Expert123!',
    name: 'Marc Durand',
    company_name: 'Durand Éco',
    siren: '741852963',
    specializations: ['CEE', 'Optimisation Énergie', 'DFS'],
    experience: '14 ans d\'expérience en développement durable et fiscalité',
    location: 'Grenoble',
    rating: 4.6,
    compensation: 20.0,
    description: 'Expert en développement durable et fiscalité verte. Spécialiste CEE, optimisation énergétique et DFS pour entreprises éco-responsables.',
    abonnement: 'growth'
  }
];

async function createExpertUsers() {
  console.log('🚀 Création des utilisateurs experts dans Supabase Auth...\n');

  const createdUsers = [];

  for (let i = 0; i < experts.length; i++) {
    const expert = experts[i];
    console.log(`📝 Création de l'expert ${i + 1}/${experts.length}: ${expert.name} (${expert.email})`);

    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: expert.email,
        password: expert.password,
        email_confirm: true,
        user_metadata: {
          name: expert.name,
          company_name: expert.company_name,
          siren: expert.siren,
          specializations: expert.specializations,
          experience: expert.experience,
          location: expert.location,
          type: 'expert'
        }
      });

      if (authError) {
        console.error(`❌ Erreur pour ${expert.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`❌ Échec de création pour ${expert.email}: pas d'utilisateur retourné`);
        continue;
      }

      console.log(`✅ Utilisateur créé: ${authData.user.id}`);

      // Ajouter l'auth_id à l'expert pour l'insertion dans la table Expert
      createdUsers.push({
        ...expert,
        auth_id: authData.user.id
      });

    } catch (error) {
      console.error(`❌ Erreur inattendue pour ${expert.email}:`, error.message);
    }
  }

  console.log(`\n📊 Résumé: ${createdUsers.length}/${experts.length} utilisateurs créés avec succès`);

  // Afficher les données pour l'insertion SQL
  console.log('\n📋 Données pour l\'insertion dans la table Expert:');
  console.log('INSERT INTO "Expert" (id, email, password, name, company_name, siren, specializations, experience, location, rating, compensation, description, status, disponibilites, certifications, card_number, card_expiry, card_cvc, abonnement, auth_id, created_at, updated_at) VALUES');
  
  createdUsers.forEach((expert, index) => {
    const disponibilites = JSON.stringify({
      "lundi": "9h-17h",
      "mardi": "9h-17h", 
      "mercredi": "9h-17h",
      "jeudi": "9h-17h",
      "vendredi": "9h-17h"
    });

    const certifications = JSON.stringify([
      `Certification ${expert.specializations[0]}`,
      `Certification ${expert.specializations[1] || expert.specializations[0]}`,
      "Certification Expert"
    ]);

    const values = `(
    gen_random_uuid(),
    '${expert.email}',
    '$2a$10$demo_password_hash',
    '${expert.name}',
    '${expert.company_name}',
    '${expert.siren}',
    ARRAY[${expert.specializations.map(s => `'${s}'`).join(', ')}],
    '${expert.experience}',
    '${expert.location}',
    ${expert.rating},
    ${expert.compensation},
    '${expert.description}',
    'active',
    '${disponibilites}',
    '${certifications}',
    NULL,
    NULL,
    NULL,
    '${expert.abonnement}',
    '${expert.auth_id}',
    NOW(),
    NOW()
)`;

    console.log(values + (index < createdUsers.length - 1 ? ',' : ';'));
  });

  return createdUsers;
}

// Exécuter le script
createExpertUsers()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }); 