import dotenv from 'dotenv';
import { supabase } from '../src/lib/supabase';

dotenv.config();

async function updateRLSPolicies() {
  try {
    console.log("🔧 Mise à jour des politiques RLS pour Supabase...");

    // Vérifier si les identifiants de service sont disponibles
    if (!process.env.SUPABASE_SERVICE_ROLE_EMAIL || !process.env.SUPABASE_SERVICE_ROLE_PASSWORD) {
      console.warn("⚠️ Identifiants de service manquants. Impossible de se connecter en tant que rôle de service.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: process.env.SUPABASE_SERVICE_ROLE_EMAIL,
        password: process.env.SUPABASE_SERVICE_ROLE_PASSWORD
      });

      if (error) {
        console.error("❌ Échec de la connexion avec le rôle de service :", error.message);
      } else {
        console.log("✅ Connecté avec succès avec le rôle de service");
      }
    }

    console.log("🔧 Activation de RLS...");
    await executeSQL(`
      ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "Expert" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "Simulation" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "SimulationProcessed" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "SimulationResult" ENABLE ROW LEVEL SECURITY;
      ALTER TABLE "ProduitEligible" ENABLE ROW LEVEL SECURITY;
    `);

    console.log("🔧 Création des politiques RLS...");
    await executeSQL(`
      CREATE POLICY client_anon_select ON "Client" FOR SELECT TO anon USING (true);
      CREATE POLICY expert_anon_select ON "Expert" FOR SELECT TO anon USING (true);
      CREATE POLICY simulation_anon_select ON "Simulation" FOR SELECT TO anon USING (true);
      CREATE POLICY simulation_processed_anon_select ON "SimulationProcessed" FOR SELECT TO anon USING (true);
      CREATE POLICY simulation_result_anon_select ON "SimulationResult" FOR SELECT TO anon USING (true);
      CREATE POLICY produit_eligible_anon_select ON "ProduitEligible" FOR SELECT TO anon USING (true);
    `);

    console.log("✅ Politiques RLS appliquées avec succès !");
  } catch (error) {
    console.error("❌ Erreur dans updateRLSPolicies:", error);
  }
}

async function executeSQL(query: string) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error("❌ Erreur SQL Supabase RPC :", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Exception lors de l'exécution de la requête :", error);
    return false;
  }
}

updateRLSPolicies()
  .then(() => console.log("✅ Script terminé"))
  .catch((err) => console.error("❌ Script échoué :", err));
