import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour générer une date aléatoire dans les 30 prochains jours
const getRandomDate = (startDate = new Date(), daysRange = 30) => {
  const randomDays = Math.floor(Math.random() * daysRange);
  const randomHours = Math.floor(Math.random() * 8) + 9; // 9h-17h
  const randomMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  
  const date = new Date(startDate);
  date.setDate(date.getDate() + randomDays);
  date.setHours(randomHours, randomMinutes, 0, 0);
  
  return date;
};

// Fonction pour générer une date de fin (durée aléatoire)
const getEndDate = (startDate, minDuration = 30, maxDuration = 180) => {
  const duration = Math.floor(Math.random() * (maxDuration - minDuration)) + minDuration;
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);
  return endDate;
};

async function generateTestData() {
  console.log('🚀 Génération de données de test pour le calendrier...\n');

  try {
    // Récupérer un client existant
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, username')
      .limit(1);

    if (clientsError || !clients || clients.length === 0) {
      console.error('❌ Aucun client trouvé pour créer les événements de test');
      return;
    }

    const clientId = clients[0].id;
    console.log(`✅ Client sélectionné: ${clients[0].username} (${clientId})`);

    // Récupérer le premier expert existant (sans filtre)
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, name, email')
      .limit(1);

    if (expertsError || !experts || experts.length === 0) {
      console.error('❌ Aucun expert trouvé pour créer les événements de test');
      return;
    }

    const expertId = experts[0].id;
    console.log(`✅ Expert sélectionné: ${experts[0].name || experts[0].email} (${expertId})`);

    // Récupérer un dossier existant
    const { data: dossiers, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select('id, client_id')
      .eq('client_id', clientId)
      .limit(1);

    if (dossiersError || !dossiers || dossiers.length === 0) {
      console.error('❌ Aucun dossier trouvé pour créer les événements de test');
      return;
    }

    const dossierId = dossiers[0].id;
    console.log(`✅ Dossier sélectionné: ${dossierId}`);

    // Événements de test
    const testEvents = [
      {
        title: 'Réunion de lancement dossier TICPE',
        description: 'Présentation du dossier et planification des étapes',
        type: 'meeting',
        priority: 'high',
        category: 'collaborative',
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        client_id: clientId,
        expert_id: expertId,
        is_online: true,
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        color: '#3B82F6'
      },
      {
        title: 'Validation des documents comptables',
        description: 'Vérification et validation des documents fournis',
        type: 'task',
        priority: 'medium',
        category: 'client',
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        client_id: clientId,
        color: '#10B981'
      },
      {
        title: 'Expertise technique sur site',
        description: 'Visite technique pour évaluation des équipements',
        type: 'appointment',
        priority: 'high',
        category: 'expert',
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        expert_id: expertId,
        location: '123 Rue de la Paix, 75001 Paris',
        color: '#F59E0B'
      },
      {
        title: 'Échéance validation dossier',
        description: 'Date limite pour la validation complète du dossier',
        type: 'deadline',
        priority: 'critical',
        category: 'system',
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        color: '#EF4444'
      },
      {
        title: 'Rappel documents manquants',
        description: 'Rappel pour fournir les documents manquants',
        type: 'reminder',
        priority: 'medium',
        category: 'client',
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        client_id: clientId,
        color: '#8B5CF6'
      }
    ];

    // Créer les événements avec des dates aléatoires
    console.log('📅 Création des événements de test...');
    
    for (const eventTemplate of testEvents) {
      const startDate = getRandomDate();
      const endDate = getEndDate(startDate);

      const eventData = {
        ...eventTemplate,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      const { data: newEvent, error: eventError } = await supabase
        .from('CalendarEvent')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error(`❌ Erreur création événement "${eventTemplate.title}":`, eventError.message);
      } else {
        console.log(`✅ Événement créé: ${eventTemplate.title} (${startDate.toLocaleDateString('fr-FR')})`);
      }
    }

    // Étapes de dossier de test
    const testSteps = [
      {
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        step_name: 'Validation initiale',
        step_type: 'validation',
        priority: 'high',
        estimated_duration: 60,
        progress: 100
      },
      {
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        step_name: 'Collecte documents',
        step_type: 'documentation',
        priority: 'medium',
        estimated_duration: 120,
        progress: 75
      },
      {
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        step_name: 'Expertise technique',
        step_type: 'expertise',
        priority: 'high',
        estimated_duration: 180,
        progress: 0
      },
      {
        dossier_id: dossierId,
        dossier_name: 'Dossier TICPE - Société ABC',
        step_name: 'Validation finale',
        step_type: 'approval',
        priority: 'critical',
        estimated_duration: 90,
        progress: 0
      }
    ];

    // Créer les étapes avec des dates d'échéance
    console.log('\n📋 Création des étapes de dossier de test...');
    
    for (const stepTemplate of testSteps) {
      const dueDate = getRandomDate(new Date(), 14); // Dans les 14 prochains jours
      
      const stepData = {
        ...stepTemplate,
        due_date: dueDate.toISOString(),
        status: stepTemplate.progress === 100 ? 'completed' : 
                stepTemplate.progress > 0 ? 'in_progress' : 'pending'
      };

      const { data: newStep, error: stepError } = await supabase
        .from('DossierStep')
        .insert([stepData])
        .select()
        .single();

      if (stepError) {
        console.error(`❌ Erreur création étape "${stepTemplate.step_name}":`, stepError.message);
      } else {
        console.log(`✅ Étape créée: ${stepTemplate.step_name} (Échéance: ${dueDate.toLocaleDateString('fr-FR')})`);
      }
    }

    console.log('\n🎉 Génération des données de test terminée !');
    console.log('📊 Vous pouvez maintenant tester l\'agenda avec des données réalistes.');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
  }
}

generateTestData().catch(console.error); 