import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCalendarTables() {
  console.log('🔍 Vérification des tables du calendrier dans Supabase...\n');

  const calendarTables = [
    'CalendarEvent',
    'CalendarEventParticipant', 
    'CalendarEventReminder',
    'DossierStep',
    'CalendarEventTemplate',
    'CalendarEventRecurrence',
    'CalendarEventAttachment'
  ];

  for (const tableName of calendarTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table "${tableName}" : ${error.message}`);
      } else {
        console.log(`✅ Table "${tableName}" : Existe`);
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}" : Erreur - ${err.message}`);
    }
  }

  // Vérifier les vues
  console.log('\n🔍 Vérification des vues du calendrier...\n');
  
  const calendarViews = [
    'v_calendar_events_with_participants',
    'v_dossier_steps_with_assignee', 
    'v_today_events'
  ];

  for (const viewName of calendarViews) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Vue "${viewName}" : ${error.message}`);
      } else {
        console.log(`✅ Vue "${viewName}" : Existe`);
      }
    } catch (err) {
      console.log(`❌ Vue "${viewName}" : Erreur - ${err.message}`);
    }
  }

  // Vérifier les données existantes
  console.log('\n🔍 Vérification des données existantes...\n');
  
  try {
    const { data: events, error: eventsError } = await supabase
      .from('CalendarEvent')
      .select('*')
      .limit(5);

    if (eventsError) {
      console.log(`❌ Erreur lors de la récupération des événements : ${eventsError.message}`);
    } else {
      console.log(`📊 Événements existants : ${events?.length || 0}`);
      if (events && events.length > 0) {
        console.log('   Exemples :', events.map(e => ({ id: e.id, title: e.title, type: e.type })));
      }
    }
  } catch (err) {
    console.log(`❌ Erreur lors de la vérification des données : ${err.message}`);
  }

  try {
    const { data: steps, error: stepsError } = await supabase
      .from('DossierStep')
      .select('*')
      .limit(5);

    if (stepsError) {
      console.log(`❌ Erreur lors de la récupération des étapes : ${stepsError.message}`);
    } else {
      console.log(`📊 Étapes existantes : ${steps?.length || 0}`);
      if (steps && steps.length > 0) {
        console.log('   Exemples :', steps.map(s => ({ id: s.id, step_name: s.step_name, status: s.status })));
      }
    }
  } catch (err) {
    console.log(`❌ Erreur lors de la vérification des étapes : ${err.message}`);
  }
}

checkCalendarTables().catch(console.error); 