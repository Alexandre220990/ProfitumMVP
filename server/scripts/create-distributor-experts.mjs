#!/usr/bin/env node

/**
 * Script de création/mise à jour des experts distributeurs (Chronotachygraphes & Logiciel Solid)
 * - Crée le compte Auth Supabase avec le mot de passe fourni (email confirmé)
 * - Insère ou met à jour l'entrée correspondante dans la table "Expert"
 *
 * Usage :
 *   node server/scripts/create-distributor-experts.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d'environnement Supabase manquantes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const nowIso = () => new Date().toISOString();

/**
 * Synchronise les specializations d'un expert vers ExpertProduitEligible
 * Version inline pour le script .mjs
 */
async function syncSpecializationsToExpertProduitEligible(expertId, specializations) {
  if (!specializations || specializations.length === 0) {
    return { created: 0, updated: 0, errors: 0 };
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const specName of specializations) {
    try {
      // Chercher le produit par nom
      const { data: produits, error: produitError } = await supabase
        .from('ProduitEligible')
        .select('id, nom')
        .ilike('nom', `%${specName}%`)
        .limit(1);

      if (produitError || !produits || produits.length === 0) {
        console.warn(`   ⚠️ Produit non trouvé pour spécialisation: ${specName}`);
        continue;
      }

      const produitId = produits[0].id;

      // Vérifier si l'entrée existe déjà
      const { data: existing, error: checkError } = await supabase
        .from('ExpertProduitEligible')
        .select('id, statut')
        .eq('expert_id', expertId)
        .eq('produit_id', produitId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`   ❌ Erreur vérification:`, checkError.message);
        errors++;
        continue;
      }

      const now = nowIso();

      if (existing) {
        // Mettre à jour si inactif
        if (existing.statut !== 'actif') {
          const { error: updateError } = await supabase
            .from('ExpertProduitEligible')
            .update({
              statut: 'actif',
              niveauExpertise: 'intermediaire',
              updated_at: now
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`   ❌ Erreur mise à jour:`, updateError.message);
            errors++;
          } else {
            updated++;
          }
        }
      } else {
        // Créer nouvelle entrée
        const { error: insertError } = await supabase
          .from('ExpertProduitEligible')
          .insert({
            expert_id: expertId,
            produit_id: produitId,
            statut: 'actif',
            niveauExpertise: 'intermediaire',
            created_at: now,
            updated_at: now
          });

        if (insertError) {
          console.error(`   ❌ Erreur création:`, insertError.message);
          errors++;
        } else {
          created++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Erreur traitement ${specName}:`, error.message);
      errors++;
    }
  }

  return { created, updated, errors };
}

const DISTRIBUTOR_EXPERTS = [
  {
    key: 'chronotachygraphes',
    email: 'oclock@profitum.fr',
    password: 'Oclockprofitum',
    name: 'O’clock – Chronotachygraphes',
    firstName: 'Alex',
    lastName: 'Grandjean',
    companyName: 'Oclock',
    phone: '',
    website: 'https://www.oclockwork.fr/',
    description:
      'Premier installateur français de chronotachygraphes digitaux. Accompagnement clé en main pour la conformité transport.',
    experience: 'Installations chronotachygraphes depuis 2010 • Service national • Support 7j/7',
    specializations: ['Chronotachygraphes digitaux', 'Télématique embarquée', 'Conformité transport'],
    sectors: ['Transport', 'Logistique'],
    languages: ['fr'],
    rating: 4.9,
    certifications: ['Certification Chronotachygraphe Digital', 'Partenaire O’clock France'],
    siren: '000000000',
  },
  {
    key: 'logiciel_solid',
    email: 'solid@profitum.fr',
    password: 'Solidprofitum',
    name: 'Solid – Logiciel de gestion',
    firstName: 'Cédric',
    lastName: 'Thérin',
    companyName: 'SDEI',
    phone: '',
    website: 'https://www.sdei.fr/',
    description:
      'Solution Solid : automatisation de la gestion comptable et RH pour PME industrielles et services.',
    experience: 'Déploiements logiciels depuis 2008 • Intégrations ERP & comptabilité',
    specializations: ['Logiciel de gestion', 'Automatisation comptable', 'Intégration ERP'],
    sectors: ['Services', 'Industrie', 'Comptabilité'],
    languages: ['fr'],
    rating: 4.8,
    certifications: ['Partenaire Solid France', 'Integrateur ERP'],
    siren: '000000001',
  },
  {
    key: 'optimisation_fournisseur_gaz',
    email: 'gaz@profitum.fr',
    password: 'Gazprofitum',
    name: 'Gaz Énergie – Optimisation',
    firstName: 'Claire',
    lastName: 'Dupont',
    companyName: 'Profitum Énergie Gaz',
    phone: '',
    website: 'https://www.profitum.fr/',
    description:
      'Spécialiste de la renégociation des contrats gaz naturel pour PME et groupes multi-sites.',
    experience: 'Optimisation contrats gaz depuis 2012 • Suivi conso & alertes prix',
    specializations: ['Gaz naturel', 'Contrats multi-sites', 'Optimisation énergétique'],
    sectors: ['Industrie', 'Transport', 'Logistique'],
    languages: ['fr'],
    rating: 4.7,
    certifications: ['Expert Optimisation Gaz'],
    siren: '000000002',
  },
  {
    key: 'optimisation_fournisseur_electricite',
    email: 'elec@profitum.fr',
    password: 'Elecprofitum',
    name: 'Électricité – Optimisation',
    firstName: 'Julien',
    lastName: 'Morel',
    companyName: 'Profitum Énergie Élec',
    phone: '',
    website: 'https://www.profitum.fr/',
    description:
      'Réduction des coûts électricité, ajustement de puissance et pilotage des consommations.',
    experience: 'Audit et renégociation électricité depuis 2010 • Pilotage énergie en temps réel',
    specializations: ['Électricité', 'CEE', 'Audit énergétique'],
    sectors: ['Industrie', 'Services', 'Retail'],
    languages: ['fr'],
    rating: 4.8,
    certifications: ['Auditeur Énergie Certifié'],
    siren: '000000003',
  },
];

async function ensureAuthUser(expert) {
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    throw new Error(`Erreur récupération utilisateur Auth (${expert.email}) : ${listError.message}`);
  }

  const matchingUser =
    userList?.users?.find(
      (user) => user.email?.toLowerCase() === expert.email.toLowerCase()
    ) ?? null;

  if (matchingUser) {
    return matchingUser;
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: expert.email,
    password: expert.password,
    email_confirm: true,
    user_metadata: {
      first_name: expert.firstName,
      last_name: expert.lastName,
      company_name: expert.companyName,
      role: 'expert',
      type: 'expert',
      product_key: expert.key,
    },
  });

  if (createError) {
    throw new Error(`Erreur création compte Auth (${expert.email}) : ${createError.message}`);
  }

  console.log(`✅ Compte Auth créé pour ${expert.email}`);
  return createdUser.user;
}

async function upsertExpert(expert, authUser) {
  const { data: existingByEmail, error: fetchError } = await supabase
    .from('Expert')
    .select('*')
    .eq('email', expert.email)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Erreur récupération expert (${expert.email}) : ${fetchError.message}`);
  }

  let existingExpert = existingByEmail;

  if (!existingExpert) {
    const { data: existingByAuth, error: fetchByAuthError } = await supabase
      .from('Expert')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (fetchByAuthError) {
      throw new Error(`Erreur récupération expert via auth_id (${expert.email}) : ${fetchByAuthError.message}`);
    }

    existingExpert = existingByAuth;
  }

  const payload = {
    id: authUser.id,
    email: expert.email,
    name: expert.name,
    company_name: expert.companyName,
    first_name: expert.firstName,
    last_name: expert.lastName,
    phone: expert.phone,
    website: expert.website,
    description: expert.description,
    experience: expert.experience,
    status: 'active',
    approval_status: 'approved',
    approved_at: nowIso(),
    approved_by: existingExpert?.approved_by ?? null,
    client_fee_percentage: 0,
    profitum_fee_percentage: 0,
    rating: expert.rating,
    specializations: expert.specializations,
    secteur_activite: expert.sectors,
    languages: expert.languages,
    certifications: expert.certifications ?? existingExpert?.certifications ?? null,
    disponibilites: existingExpert?.disponibilites ?? null,
    documents: existingExpert?.documents ?? null,
    siren: existingExpert?.siren ?? expert.siren,
    auth_id: authUser.id,
    auth_user_id: authUser.id,
    is_active: true,
    total_assignments: existingExpert?.total_assignments ?? 0,
    completed_assignments: existingExpert?.completed_assignments ?? 0,
    total_earnings: existingExpert?.total_earnings ?? 0,
    monthly_earnings: existingExpert?.monthly_earnings ?? 0,
    completed_projects: existingExpert?.completed_projects ?? 0,
    created_at: existingExpert?.created_at ?? nowIso(),
    updated_at: nowIso(),
    abonnement: existingExpert?.abonnement ?? null,
  };

  if (!existingExpert) {
    const { error: insertError } = await supabase.from('Expert').insert(payload);
    if (insertError) {
      throw new Error(`Erreur insertion expert (${expert.email}) : ${insertError.message}`);
    }
    console.log(`✅ Expert créé : ${expert.name} (${expert.email})`);
  } else {
    const { error: updateError } = await supabase
      .from('Expert')
      .update(payload)
      .eq('id', existingExpert.id);
    if (updateError) {
      throw new Error(`Erreur mise à jour expert (${expert.email}) : ${updateError.message}`);
    }
    console.log(`ℹ️ Expert mis à jour : ${expert.name} (${expert.email})`);
  }
}

async function main() {
  try {
    console.log('🚀 Création/mise à jour des experts distributeurs...');

    for (const expert of DISTRIBUTOR_EXPERTS) {
      console.log(`\n----------------------------------------`);
      console.log(`👤 Traitement : ${expert.name} (${expert.email})`);

      const authUser = await ensureAuthUser(expert);
      console.log(`   ↳ Auth user id : ${authUser.id}`);
      await upsertExpert(expert, authUser);

      // Synchroniser les spécialisations vers ExpertProduitEligible
      if (expert.specializations && expert.specializations.length > 0) {
        console.log(`   ↳ Synchronisation vers ExpertProduitEligible...`);
        const syncResult = await syncSpecializationsToExpertProduitEligible(
          authUser.id,
          expert.specializations
        );
        console.log(`   ↳ Résultat: ${syncResult.created} créé(s), ${syncResult.updated} mis à jour, ${syncResult.errors} erreur(s)`);
      }

      console.log(`📧 Identifiants : ${expert.email} / ${expert.password}`);
    }

    console.log('\n✅ Scripts terminés avec succès.');
  } catch (error) {
    console.error('\n❌ Erreur lors de la création des experts :', error);
    process.exit(1);
  }
}

main();

