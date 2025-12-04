# 🔍 Trace Exacte des Prompts V4 dans le Code

## 📍 Point d'entrée: Interface de prospection

**URL**: `https://www.profitum.app/admin/prospection`

**Fichier**: `client/src/pages/admin/prospection.tsx`

### Ligne 887 - Appel API lors du clic "Générer Séquence IA"

```typescript
const response = await fetch(`${config.API_URL}/api/prospects/generate-ai-sequence-v2`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prospectInfo,      // Données du prospect
    steps,             // Configuration séquence
    context: aiContext.trim(),
    forceReenrichment: false
  })
});
```

---

## 📡 Endpoint API Backend

**Fichier**: `server/src/routes/prospects.ts`

### Ligne 1190 - Définition de l'endpoint

```typescript
router.post('/generate-ai-sequence-v2', async (req, res) => {
```

### Lignes 1192-1208 - Validation des données

```typescript
const { prospectInfo, steps, context, forceReenrichment = false } = req.body;

if (!prospectInfo || !steps || !Array.isArray(steps) || steps.length === 0) {
  return res.status(400).json({
    success: false,
    error: 'Informations prospect et étapes requises'
  });
}
```

### Lignes 1210-1260 - ⭐ APPEL V4 COMPLET

```typescript
// Normaliser les données du prospect
const normalizedProspect: Prospect = {
  id: prospectInfo.id,
  company_name: prospectInfo.company_name || prospectInfo.name,
  email: prospectInfo.email,
  firstname: prospectInfo.firstname || prospectInfo.first_name,
  lastname: prospectInfo.lastname || prospectInfo.last_name,
  job_title: prospectInfo.job_title,
  naf_code: prospectInfo.naf_code,
  naf_label: prospectInfo.naf_label,
  siren: prospectInfo.siren,
  linkedin_company: prospectInfo.linkedin_company || null,
  linkedin_profile: prospectInfo.linkedin_profile || null,
  company_website: prospectInfo.company_website || null,
  // ... autres champs
};

// ⭐ ICI: Enrichissement V4 avec toutes les sources
const enrichedDataV4 = await ProspectEnrichmentServiceV4.enrichProspectComplete(
  normalizedProspect,
  steps.length,        // Pour ajuster nombre emails selon contexte
  forceReenrichment
);
```

---

## 🔧 Service d'enrichissement V4

**Fichier**: `server/src/services/ProspectEnrichmentServiceV4.ts`

### Ligne 484 - Fonction principale `enrichProspectComplete()`

```typescript
async enrichProspectComplete(
  prospectInfo: Prospect,
  defaultNumEmails: number = 3,
  forceReenrichment: boolean = false
): Promise<EnrichedProspectDataV4>
```

### Lignes 538-554 - ⭐ PROMPT 1: LinkedIn

```typescript
// 1. Enrichissement LinkedIn (si nécessaire)
let linkedinData: LinkedInEnrichmentData | null = cachedLinkedin;
if (needsLinkedin) {
  console.log('📱 Enrichissement LinkedIn...');
  linkedinData = await this.enrichLinkedIn(
    prospectInfo.company_name || '',
    prospectInfo.siren,
    `${prospectInfo.firstname || ''} ${prospectInfo.lastname || ''}`.trim(),
    prospectInfo.job_title,
    prospectInfo.linkedin_company,     // ⭐ URL LinkedIn entreprise
    prospectInfo.linkedin_profile,     // ⭐ URL LinkedIn décisionnaire
    prospectInfo.id,
    forceReenrichment
  );
}
```

#### Détail PROMPT 1 - Lignes 27-183

**Fonction**: `enrichLinkedIn()`

```typescript
const prompt = `Tu es un expert en recherche et analyse de profils professionnels LinkedIn.

📊 DONNÉES FOURNIES :
- Entreprise : ${companyName}
- SIREN : ${siren || 'non disponible'}
- Décisionnaire : ${fullName || 'non disponible'}
- Poste : ${jobTitle || 'non disponible'}
- Date actuelle : ${currentDate}
- URL LinkedIn Entreprise : ${linkedinCompanyUrl || 'À rechercher'}
- URL LinkedIn Décisionnaire : ${linkedinProfileUrl || 'À rechercher'}

🎯 TA MISSION :
Analyse les informations LinkedIn disponibles et fournis une synthèse structurée...

⚠️ RÈGLES CRITIQUES SUR LES DATES :
1. **DATES OBLIGATOIRES** : Toujours fournir une date précise (YYYY-MM-DD)
2. **STATUT TEMPOREL OBLIGATOIRE** : FUTUR | EN_COURS | PASSE | PERIME
3. **ICE BREAKERS ADAPTATIFS** : Toujours fournir 2 versions (futur/passé)
4. **SCORE AJUSTÉ** : Réduire le score si événement trop ancien

Format JSON attendu :
{
  "entreprise_linkedin": { ... },
  "decisionnaire_linkedin": { ... },
  "ice_breakers_generes": [
    {
      "type": "Événement",
      "phrase": "...",
      "phrase_alternative_si_passe": "...",
      "statut_temporel": "FUTUR | PASSE | EN_COURS",
      "score": 9,
      "date_reference": "YYYY-MM-DD"
    }
  ]
}`;

// ⭐ Appel GPT-4o
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.4
});
```

### Lignes 556-569 - ⭐ PROMPT 2: Site Web

```typescript
// 2. Enrichissement Site Web (si nécessaire)
let webData: WebEnrichmentData | null = cachedWeb;
if (needsWeb) {
  console.log('🌐 Enrichissement Site Web...');
  webData = await this.enrichWebsite(
    prospectInfo.company_name || '',
    prospectInfo.company_website,      // ⭐ URL site web
    '', // TODO: Implémenter scraping réel
    prospectInfo.id,
    forceReenrichment
  );
}
```

#### Détail PROMPT 2 - Lignes 186-296

**Fonction**: `enrichWebsite()`

```typescript
const prompt = `Tu es un expert en analyse de sites web d'entreprises.

📊 DONNÉES FOURNIES :
- Entreprise : ${companyName}
- URL Site Web : ${websiteUrl}
- Contenu Scrapé : ${scrapedContent || 'Non disponible'}

🎯 TA MISSION :
Analyse le contenu du site web et fournis une synthèse structurée...

Format JSON attendu :
{
  "site_web_analyse": {
    "activites_principales": [...],
    "valeurs_entreprise": [...],
    "actualites_site": [...],
    "certifications_labels": [...]
  },
  "opportunites_profitum": {
    "signaux_eligibilite_ticpe": {
      "score": 0-10,
      "raison": "...",
      "preuves": [...]
    },
    "signaux_eligibilite_cee": { ... },
    "signaux_optimisation_sociale": { ... }
  }
}`;

// ⭐ Appel GPT-4o
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.4
});
```

### Lignes 571-584 - ⭐ PROMPT 3: Données Opérationnelles

```typescript
// 3. Enrichissement Opérationnel (si nécessaire)
let operationalData: OperationalEnrichmentData = cachedOperational || ...;
if (needsOperational) {
  console.log('🔍 Enrichissement Opérationnel...');
  operationalData = await this.enrichOperationalData(
    prospectInfo,
    linkedinData,    // ⭐ Utilise résultats PROMPT 1
    webData,         // ⭐ Utilise résultats PROMPT 2
    null,            // TODO: Données publiques SIRENE
    forceReenrichment
  );
}
```

#### Détail PROMPT 3 - Lignes 299-385

**Fonction**: `enrichOperationalData()`

```typescript
const prompt = `Tu es un analyste d'entreprise expert spécialisé dans l'extraction 
de données opérationnelles précises pour les entreprises françaises.

📊 INFORMATIONS DU PROSPECT :
- Entreprise : ${prospectInfo.company_name || 'Non renseigné'}
- SIREN : ${prospectInfo.siren || 'non disponible'}
- Code NAF : ${prospectInfo.naf_code || 'non disponible'}
- Libellé NAF : ${prospectInfo.naf_label || 'non disponible'}

📱 DONNÉES LINKEDIN DISPONIBLES :
${linkedinData ? JSON.stringify(linkedinData, null, 2) : 'Non disponibles'}

🌐 DONNÉES SITE WEB SCRAPÉES :
${webData ? JSON.stringify(webData, null, 2) : 'Non disponibles'}

🎯 TA MISSION CRITIQUE :
Extraire ou estimer les données opérationnelles suivantes avec le maximum de précision :

- **Nombre de poids lourds +7.5T** : Essentiel pour TICPE
- **Nombre de chauffeurs** : Calcul via ratio 1.3-1.5 chauffeurs/véhicule
- **Nombre de salariés totaux** : Priorité données LinkedIn/SIRENE
- **Chiffre d'affaires** : Societe.com ou estimation NAF
- **Taille locaux en m²** : Mention site web ou estimation
- **Statut propriété** : PROPRIETAIRE ou LOCATAIRE

Format JSON avec scoring :
{
  "donnees_operationnelles": {
    "ressources_humaines": {
      "nombre_salaries_total": {
        "valeur": 45,
        "source": "LinkedIn",
        "confiance": 8
      }
    },
    "parc_vehicules": {
      "poids_lourds_plus_7_5T": {
        "valeur": 18,
        "confiance": 9,
        "eligibilite_ticpe": {
          "eligible": true,
          "potentiel_annuel_estime": "91 000€/an"
        }
      }
    }
  },
  "signaux_eligibilite_profitum": {
    "ticpe": {
      "eligible": true,
      "score_certitude": 9,
      "potentiel_economie_annuelle": "91 000€/an",
      "priorite": "HAUTE"
    }
  },
  "potentiel_global_profitum": {
    "economies_annuelles_totales": {
      "minimum": 80000,
      "maximum": 120000,
      "moyenne": 100000
    },
    "score_attractivite_prospect": 9
  }
}`;

// ⭐ Appel GPT-4o
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.4
});
```

### Lignes 586-598 - ⭐ PROMPT 4: Analyse Temporelle

```typescript
// 4. Analyse Temporelle (si nécessaire)
let timingAnalysis: TimingAnalysis = cachedTiming || ...;
if (needsTiming) {
  console.log('📅 Analyse Temporelle...');
  timingAnalysis = await this.analyzeContextualTiming(
    prospectInfo,
    operationalData,   // ⭐ Utilise score attractivité de PROMPT 3
    defaultNumEmails,
    forceReenrichment
  );
}
```

#### Détail PROMPT 4 - Lignes 390-479

**Fonction**: `analyzeContextualTiming()`

```typescript
const currentDate = new Date();
const dateStr = currentDate.toISOString().split('T')[0];
const dayOfWeek = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' });
const month = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
const quarter = `Q${Math.floor(currentDate.getMonth() / 3) + 1}`;

// ⭐ Récupération du score attractivité calculé par PROMPT 3
const scoreAttractivite = operationalData?.potentiel_global_profitum?.score_attractivite_prospect ?? 5;
const potentielMoyen = operationalData?.potentiel_global_profitum?.economies_annuelles_totales?.moyenne ?? 0;

const prompt = `Tu es un expert en timing commercial et psychologie des cycles d'affaires B2B.

📅 CONTEXTE TEMPOREL ACTUEL :
- Date actuelle : ${dateStr}
- Jour de la semaine : ${dayOfWeek}
- Mois : ${month}
- Trimestre : ${quarter}

📊 INFORMATIONS DU PROSPECT :
- Entreprise : ${prospectInfo.company_name}
- Secteur : ${prospectInfo.naf_label}
- Score attractivité : ${scoreAttractivite}/10
- Potentiel économies : ${potentielMoyen}€/an

📝 CONFIGURATION ACTUELLE SÉQUENCE :
- Nombre d'emails par défaut : ${defaultNumEmails}

🎯 TA MISSION :
Analyser le contexte et RECOMMANDER le nombre optimal d'emails pour cette séquence.

Considère :
- La période de l'année (fêtes, vacances, périodes fiscales)
- Le score d'attractivité du prospect (⭐ vient de PROMPT 3)
- La charge mentale probable des décisionnaires
- Les événements à venir

Format JSON avec ajustement automatique :
{
  "recommandations_sequence": {
    "nombre_emails_recommande": 4,
    "ajustement_vs_defaut": +1,
    "rationale_detaillee": "Augmentation car prospect haute valeur (9/10)...",
    "matrice_decision": {
      "si_score_attractivite_eleve_7_9": "4 emails"
    }
  },
  "scoring_opportunite": {
    "score_global_timing": 7,
    "action_recommandee": "ENVOYER_MAINTENANT"
  }
}`;

// ⭐ Appel GPT-4o
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
  temperature: 0.5  // Plus créatif pour recommandations
});
```

### Lignes 600-617 - Assemblage des résultats

```typescript
const result: EnrichedProspectDataV4 = {
  linkedin_data: linkedinData,           // ⭐ Résultat PROMPT 1
  web_data: webData,                     // ⭐ Résultat PROMPT 2
  operational_data: operationalData,     // ⭐ Résultat PROMPT 3
  timing_analysis: timingAnalysis,       // ⭐ Résultat PROMPT 4
  enriched_at: new Date().toISOString(),
  enrichment_version: 'v4.0'             // ⭐ Marqueur V4
};

// Mettre en cache l'enrichissement complet
if (prospectInfo.id) {
  await ProspectCacheService.setCachedEnrichment(prospectInfo.id, 'full', result);
}

console.log(`✅ Enrichissement V4 terminé pour ${prospectInfo.company_name}`);

return result;
```

---

## 🔄 Génération de la séquence avec V4

**Fichier**: `server/src/routes/prospects.ts`

### Lignes 1262-1279 - Utilisation du générateur V4

```typescript
// Préparer les steps avec leurs délais
const adjustedSteps: EmailStep[] = steps.map((step: any) => ({
  stepNumber: step.stepNumber,
  delayDays: step.delayDays,
  subject: '',
  body: ''
}));

// ⭐ Utiliser le générateur V4 pour créer la séquence
const { sequence, adjustment } = await SequenceGeneratorServiceV4.generateOptimalSequence(
  normalizedProspect,
  enrichedDataV4,      // ⭐ Toutes les données enrichies V4
  context || '',
  steps.length
);
```

---

## 💾 Sauvegarde en base

**Fichier**: `server/src/routes/prospects.ts`

### Lignes 1262-1271 - Sauvegarde enrichissement

```typescript
// Sauvegarder l'enrichissement V4 en base
if (normalizedProspect.id) {
  await supabase
    .from('prospects')
    .update({
      enrichment_status: 'completed',
      enrichment_data: enrichedDataV4,    // ⭐ Structure V4 complète
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', normalizedProspect.id);
}
```

---

## 📊 Réponse finale à l'utilisateur

**Fichier**: `server/src/routes/prospects.ts`

### Lignes 1288-1304 - Structure de réponse

```typescript
return res.json({
  success: true,
  data: {
    enrichment: enrichedDataV4,          // ⭐ Toutes les données V4
    steps: sequence.steps,               // ⭐ Séquence générée
    adjustment: adjustment,              // ⭐ Ajustement automatique
    prospect_insights: {
      potentiel_economies: enrichedDataV4.operational_data?.potentiel_global_profitum?.economies_annuelles_totales,
      score_attractivite: enrichedDataV4.operational_data?.potentiel_global_profitum?.score_attractivite_prospect,
      timing_score: enrichedDataV4.timing_analysis?.scoring_opportunite?.score_global_timing
    }
  }
});
```

---

## 📈 Schéma du flux complet

```
┌──────────────────────────────────────────────────────────────────┐
│  Interface: prospection.tsx (ligne 887)                         │
│  Action: Clic "Générer Séquence IA"                             │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  API: prospects.ts (ligne 1190)                                 │
│  Endpoint: POST /generate-ai-sequence-v2                        │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Service: ProspectEnrichmentServiceV4.ts (ligne 484)            │
│  Fonction: enrichProspectComplete()                             │
└────────────────────┬─────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┬──────────────┬────────────┐
         │                       │              │            │
         ▼                       ▼              ▼            ▼
┌──────────────┐    ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
│ PROMPT 1     │    │ PROMPT 2     │  │ PROMPT 3    │  │ PROMPT 4    │
│ LinkedIn     │    │ Site Web     │  │ Opérationnel│  │ Timing      │
│ (ligne 27)   │    │ (ligne 186)  │  │ (ligne 299) │  │ (ligne 390) │
├──────────────┤    ├──────────────┤  ├─────────────┤  ├─────────────┤
│ GPT-4o       │    │ GPT-4o       │  │ GPT-4o      │  │ GPT-4o      │
│ Temp: 0.4    │    │ Temp: 0.4    │  │ Temp: 0.4   │  │ Temp: 0.5   │
└──────┬───────┘    └──────┬───────┘  └──────┬──────┘  └──────┬──────┘
       │                   │                 │                 │
       ▼                   ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Ice breakers    Actualités        Scoring           Ajustement  │
│  Événements      Certifications    TICPE/CEE/Social  nombre      │
│  Posts récents   Technologies      Score 0-10        emails      │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Résultat: EnrichedProspectDataV4                               │
│  {                                                               │
│    linkedin_data: { ice_breakers_generes: [...] },             │
│    web_data: { actualites_site: [...] },                       │
│    operational_data: { score_attractivite: 9 },                │
│    timing_analysis: { nombre_emails_recommande: 4 }            │
│  }                                                               │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Sauvegarde Supabase (ligne 1262)                               │
│  Table: prospects                                                │
│  Champ: enrichment_data (JSONB)                                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Génération séquence V4 (ligne 1275)                            │
│  SequenceGeneratorServiceV4.generateOptimalSequence()           │
│  - Fusion ice breakers                                          │
│  - Fluidité narrative                                           │
│  - Adaptation temporelle                                        │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Réponse API (ligne 1288)                                       │
│  {                                                               │
│    enrichment: { linkedin_data, operational_data, ... },       │
│    steps: [ { subject, body, ... } ],                          │
│    adjustment: { adjusted: true, new_num: 4 },                 │
│    prospect_insights: { score_attractivite: 9 }                │
│  }                                                               │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│  Interface: Affichage résultat                                  │
│  - Séquence générée                                             │
│  - Données enrichies visibles                                   │
│  - Score attractivité affiché                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ Conclusion

**Chaque génération de séquence depuis l'interface déclenche**:

1. ✅ **4 appels GPT-4o** (ou cache si déjà fait)
2. ✅ **Recherche LinkedIn** complète (entreprise + décisionnaire)
3. ✅ **Analyse site web** avec scoring éligibilité
4. ✅ **Calculs opérationnels** précis avec confiance
5. ✅ **Analyse temporelle** avec ajustement automatique
6. ✅ **Génération optimisée** avec fusion ice breakers
7. ✅ **Sauvegarde en base** structure V4 complète

**Trace exacte du code**:
- Frontend: `client/src/pages/admin/prospection.tsx:887`
- Backend: `server/src/routes/prospects.ts:1190`
- Service: `server/src/services/ProspectEnrichmentServiceV4.ts:484`
- Prompts: Lignes 27, 186, 299, 390

**Version actuelle**: `v4.0` (visible dans `enrichment_version`)

