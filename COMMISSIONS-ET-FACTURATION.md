# 💰 SYSTÈME DE COMMISSIONS ET FACTURATION

**Date:** 2025-11-05  
**Version:** 1.0

---

## 🎯 **PRINCIPES**

### **Commission Profitum (Expert)**
- **Taux standard :** 30% du montant du dossier
- **Base de calcul :** Montant RÉEL reçu par le client (pas l'estimation)
- **Colonne BDD :** `Expert.compensation` (défaut: 0.30)
- **Personnalisable :** Oui, par admin selon contrat expert

### **Commission Apporteur**
- **Taux standard :** 10% de la commission Profitum
- **Base de calcul :** Commission expert (pas le montant client)
- **Colonne BDD :** `ApporteurAffaires.commission_rate` (défaut: 0.10)
- **Personnalisable :** Oui, par admin manuellement

---

## 🧾 **FACTURATION AUTOMATIQUE**

### **Déclencheur**
✅ **Quand le CLIENT valide l'audit** (Phase 9)

### **Contenu de la facture**
```
FACTURE PROFITUM N° PROF-2025-XXXX
Date: [date_validation_audit]

Client: [Raison sociale]
SIREN: [SIREN]

Dossier: [Produit] - Réf: [CPE_ID]
Expert assigné: [Nom expert]
Apporteur d'affaires: [Nom apporteur] (si présent)

Montant du dossier validé : XX € 
Taux de rémunération : XX %
Montant HT : XX €
TVA 20% : XX €
───────────────────
TOTAL TTC : XX €

Paiement sous 30 jours
RIB Profitum : ...
```

### **Cas d'erreur**
```
SI Expert.compensation = NULL ou montantFinal = NULL:

FACTURE PROFITUM N° PROF-2025-XXXX
...
ERREUR DE CALCUL
Impossible de calculer la commission
Raison: [Données manquantes en BDD]
→ Contacter support@profitum.fr

Montant HT : 0.00 €
TVA : 0.00 €
TOTAL TTC : 0.00 €

⚠️ Cette facture nécessite une correction manuelle
```

---

## 📊 **STRUCTURE BDD**

### **Table Expert**
```sql
Expert {
  compensation DOUBLE PRECISION NOT NULL DEFAULT 0.30
    -- Taux de rémunération Profitum (30% standard)
    -- Exemple: 0.25 = 25%, 0.35 = 35%
}

-- hourly_rate SUPPRIMÉE (inutilisée)
```

### **Table ApporteurAffaires**
```sql
ApporteurAffaires {
  commission_rate NUMERIC NOT NULL DEFAULT 0.10
    -- Taux de commission apporteur (10% standard)
    -- Calculé sur commission expert
}
```

### **Table invoice** (Étendue pour Profitum)
```sql
invoice {
  -- Colonnes existantes
  id UUID PRIMARY KEY
  invoice_number VARCHAR -- Déjà existant
  client_id UUID → Client
  expert_id UUID → Expert
  amount NUMERIC
  status VARCHAR
  issue_date TIMESTAMP
  due_date TIMESTAMP
  paid_date TIMESTAMP
  description TEXT
  items JSONB
  metadata JSONB
  
  -- Colonnes AJOUTÉES pour Profitum
  client_produit_eligible_id UUID → ClientProduitEligible
  apporteur_id UUID → ApporteurAffaires (nullable)
  montant_audit NUMERIC -- Base de calcul
  taux_compensation_expert NUMERIC -- % expert (ex: 0.30)
  taux_commission_apporteur NUMERIC -- % apporteur (ex: 0.10)
  error_message TEXT -- Si erreur calcul
  pdf_storage_path TEXT -- Chemin Storage
  pdf_generated_at TIMESTAMP
}
```

---

## 🔄 **FLUX DE FACTURATION**

### **1. Génération automatique (Client valide audit)**
```typescript
// Route: POST /api/client/dossier/:id/validate-audit

try {
  // Récupérer données
  const dossier = await getCPE(id);
  const expert = await getExpert(dossier.expert_id);
  const apporteur = dossier.apporteur_id 
    ? await getApporteur(dossier.apporteur_id) 
    : null;
  
  // Calculs
  const montantAudit = dossier.montantFinal;
  const tauxExpert = expert.compensation ?? 0.30;
  const tauxApporteur = apporteur?.commission_rate ?? 0.10;
  
  const montantHT = montantAudit * tauxExpert;
  const tva = montantHT * 0.20;
  const montantTTC = montantHT + tva;
  const commissionApporteur = montantHT * tauxApporteur;
  
  // Générer numéro facture
  const numeroFacture = await generateFactureNumber(); // "PROF-2025-XXXX"
  
  // Créer facture
  await supabase.from('Facture').insert({
    numero_facture: numeroFacture,
    client_id: dossier.clientId,
    client_produit_eligible_id: id,
    expert_id: expert.id,
    apporteur_id: apporteur?.id,
    montant_audit: montantAudit,
    taux_compensation_expert: tauxExpert,
    taux_commission_apporteur: tauxApporteur,
    montant_ht: montantHT,
    tva: tva,
    montant_ttc: montantTTC,
    status: 'generated',
    metadata: {
      dossier_ref: id,
      expert_name: expert.name,
      apporteur_name: apporteur?.name,
      calcul_date: new Date(),
      commission_apporteur: commissionApporteur
    }
  });
  
  // Générer PDF (librairie PDFKit ou similaire)
  await generateFacturePDF(facture);
  
  // Timeline
  await DossierTimelineService.addEvent({
    dossier_id: id,
    type: 'billing',
    title: '🧾 Facture Profitum générée',
    description: `Facture ${numeroFacture} - ${montantTTC}€ TTC`,
    metadata: { facture_id, numero: numeroFacture }
  });
  
} catch (error) {
  // En cas d'erreur, créer quand même la facture avec erreur
  await supabase.from('Facture').insert({
    ...
    montant_ht: 0,
    montant_ttc: 0,
    status: 'error',
    error_message: `Erreur: ${error.message}`
  });
}
```

### **2. Envoi facture au client**
```
📧 Email automatique avec PDF joint
📧 Disponible dans espace client (section Facturation)
```

### **3. Suivi paiement**
```
Admin marque facture comme "paid" quand client paie
→ Déclenche paiement des commissions
```

---

## 📝 **MIGRATION À EXÉCUTER**

**Fichier:** `server/migrations/20250110_fix_commissions.sql`

**Actions:**
1. ✅ Supprime `Expert.hourly_rate`
2. ✅ Met `Expert.compensation` à 30% pour tous les NULL/0
3. ✅ Met défaut `Expert.compensation = 0.30`
4. ✅ Met `ApporteurAffaires.commission_rate` à 10% pour tous les NULL/0
5. ✅ Met défaut `ApporteurAffaires.commission_rate = 0.10`
6. ✅ Crée table `Facture` avec tous les champs

**→ À exécuter dans Supabase SQL Editor**

---

## ✅ **VÉRIFICATIONS POST-MIGRATION**

Requêtes incluses dans le script :
- Distribution des taux experts
- Distribution des taux apporteurs
- Vérification table Facture créée

---

## 🚀 **PROCHAINES ÉTAPES**

Après exécution de la migration :

1. **Créer route génération facture**
   - POST `/api/client/dossier/:id/validate-audit`
   - Génère facture automatiquement

2. **Créer service PDF**
   - Template facture Profitum
   - Génération PDF avec PDFKit
   - Upload vers Supabase Storage

3. **Créer routes expert suivi administration**
   - POST `/api/expert/dossier/:id/mark-as-submitted`
   - POST `/api/expert/dossier/:id/record-final-result`

4. **Frontend**
   - Boutons expert (soumission + résultat)
   - Affichage facture dans espace client
   - Module commissions dans dashboard apporteur/expert

---

**PRÊT POUR EXÉCUTION !** 🎊

