/**
 * Script de correction rétroactive des dossiers avec documents rejetés
 * 
 * Problème : Les documents rejetés AVANT la mise en place du workflow automatique
 * n'ont pas déclenché la mise à jour du statut du dossier.
 * 
 * Solution : Ce script met à jour les dossiers existants qui ont des documents
 * rejetés pour les passer au statut 'documents_manquants' et étape 3.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executerFix() {
  console.log('🔧 Démarrage du fix rétroactif des documents manquants...\n');

  try {
    // ====================================================================
    // 1️⃣ DIAGNOSTIC : Trouver les dossiers concernés
    // ====================================================================
    console.log('📊 1️⃣ DIAGNOSTIC : Recherche des dossiers avec documents rejetés...\n');

    const { data: dossiersAves, error: diagError } = await supabase.rpc('get_dossiers_avec_docs_rejetes', {});
    
    // Fallback si la fonction RPC n'existe pas : utiliser une requête manuelle
    const { data: dossiers, error: dossierError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        statut,
        current_step,
        expert_id,
        metadata,
        ProduitEligible:produitId(nom),
        Expert:expert_id(name)
      `)
      .not('expert_id', 'is', null);

    if (dossierError) {
      throw dossierError;
    }

    // Récupérer les documents pour chaque dossier
    const dossiersAvecRejets = [];
    
    for (const dossier of dossiers) {
      const { data: documents, error: docError } = await supabase
        .from('ClientProcessDocument')
        .select('id, filename, status, rejection_reason, validated_at')
        .eq('client_produit_id', dossier.id);

      if (!docError && documents) {
        const docsRejetes = documents.filter(d => d.status === 'rejected');
        const docsValides = documents.filter(d => d.status === 'validated');

        if (docsRejetes.length > 0) {
          dossiersAvecRejets.push({
            ...dossier,
            nb_documents_total: documents.length,
            nb_documents_rejetes: docsRejetes.length,
            nb_documents_valides: docsValides.length,
            dernier_doc_rejete: docsRejetes[0]?.filename,
            derniere_raison_rejet: docsRejetes[0]?.rejection_reason,
            date_dernier_rejet: docsRejetes[0]?.validated_at
          });
        }
      }
    }

    console.log(`   📋 ${dossiersAvecRejets.length} dossier(s) trouvé(s) avec documents rejetés\n`);

    if (dossiersAvecRejets.length === 0) {
      console.log('✅ Aucun dossier à corriger. Tout est à jour !');
      return;
    }

    // Afficher les détails
    console.log('   Détails des dossiers à corriger :');
    dossiersAvecRejets.forEach((d, idx) => {
      console.log(`   ${idx + 1}. Dossier ${d.id}`);
      console.log(`      - Statut actuel : ${d.statut}`);
      console.log(`      - Étape actuelle : ${d.current_step}`);
      console.log(`      - Documents rejetés : ${d.nb_documents_rejetes}/${d.nb_documents_total}`);
      console.log(`      - Dernier rejet : ${d.dernier_doc_rejete}`);
      console.log(`      - Raison : ${d.derniere_raison_rejet}`);
      console.log('');
    });

    // ====================================================================
    // 2️⃣ MISE À JOUR : Corriger les dossiers
    // ====================================================================
    console.log('🔄 2️⃣ MISE À JOUR : Correction des dossiers...\n');

    let nbCorriges = 0;
    let nbEchecs = 0;

    for (const dossier of dossiersAvecRejets) {
      // Ne corriger que si pas déjà au statut documents_manquants
      if (dossier.statut === 'documents_manquants') {
        console.log(`   ⏭️  Dossier ${dossier.id} : déjà au statut documents_manquants`);
        continue;
      }

      // Ne corriger que les étapes 2 ou 3
      if (dossier.current_step !== 2 && dossier.current_step !== 3) {
        console.log(`   ⏭️  Dossier ${dossier.id} : étape ${dossier.current_step} (pas concerné)`);
        continue;
      }

      try {
        // Récupérer le dernier document rejeté
        const { data: dernierRejet } = await supabase
          .from('ClientProcessDocument')
          .select('id, filename, rejection_reason, validated_at')
          .eq('client_produit_id', dossier.id)
          .eq('status', 'rejected')
          .order('validated_at', { ascending: false })
          .limit(1)
          .single();

        // Préparer les metadata (gestion json vs jsonb)
        let currentMetadata = {};
        try {
          if (dossier.metadata) {
            currentMetadata = typeof dossier.metadata === 'string' 
              ? JSON.parse(dossier.metadata) 
              : dossier.metadata;
          }
        } catch (e) {
          console.log(`   ⚠️  Metadata invalide pour dossier ${dossier.id}, utilisation d'un objet vide`);
        }

        const newMetadata = {
          ...currentMetadata,
          documents_missing: true,
          last_document_rejection: {
            document_id: dernierRejet?.id,
            document_name: dernierRejet?.filename,
            rejected_at: dernierRejet?.validated_at,
            rejection_reason: dernierRejet?.rejection_reason
          },
          fixed_retroactively: true,
          fix_date: new Date().toISOString()
        };

        // Mettre à jour le dossier
        const { error: updateError } = await supabase
          .from('ClientProduitEligible')
          .update({
            statut: 'documents_manquants',
            current_step: 3,
            metadata: newMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', dossier.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`   ✅ Dossier ${dossier.id} : corrigé avec succès`);
        nbCorriges++;

      } catch (error) {
        console.error(`   ❌ Dossier ${dossier.id} : erreur lors de la correction`, error.message);
        nbEchecs++;
      }
    }

    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DE LA CORRECTION');
    console.log('════════════════════════════════════════════════════════');
    console.log(`   ✅ Dossiers corrigés : ${nbCorriges}`);
    console.log(`   ❌ Échecs : ${nbEchecs}`);
    console.log(`   ⏭️  Ignorés (déjà OK) : ${dossiersAvecRejets.length - nbCorriges - nbEchecs}`);
    console.log('════════════════════════════════════════════════════════\n');

    // ====================================================================
    // 3️⃣ VÉRIFICATION : Afficher les résultats
    // ====================================================================
    console.log('🔍 3️⃣ VÉRIFICATION : État final des dossiers corrigés...\n');

    const { data: dossiersCorrigesFinal, error: verifError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        statut,
        current_step,
        metadata,
        updated_at,
        Client:clientId(company_name),
        ProduitEligible:produitId(nom),
        Expert:expert_id(name)
      `)
      .eq('statut', 'documents_manquants');

    if (verifError) {
      throw verifError;
    }

    const dossiersFixesRetroactivement = dossiersCorrigesFinal.filter(
      d => d.metadata?.fixed_retroactively === true
    );

    console.log(`   📋 ${dossiersFixesRetroactivement.length} dossier(s) avec fix rétroactif\n`);

    if (dossiersFixesRetroactivement.length > 0) {
      dossiersFixesRetroactivement.forEach((d, idx) => {
        console.log(`   ${idx + 1}. ${d.id}`);
        console.log(`      - Client : ${d.Client?.company_name || 'N/A'}`);
        console.log(`      - Produit : ${d.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      - Expert : ${d.Expert?.name || 'N/A'}`);
        console.log(`      - Document rejeté : ${d.metadata?.last_document_rejection?.document_name}`);
        console.log(`      - Raison : ${d.metadata?.last_document_rejection?.rejection_reason}`);
        console.log('');
      });
    }

    console.log('✅ Fix rétroactif terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du fix :', error);
    process.exit(1);
  }
}

// Exécuter le script
executerFix();

