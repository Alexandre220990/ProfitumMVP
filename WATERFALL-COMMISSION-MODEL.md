# 📊 MODÈLE DE COMMISSION PROFITUM (Waterfall)

## 🔄 FLUX COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│                    REMBOURSEMENT CLIENT                      │
│                        10,000 €                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Paie 30% (client_fee_percentage)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPERT REÇOIT                              │
│                        3,000 €                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Paie 30% (profitum_fee_percentage)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PROFITUM REÇOIT                             │
│                         900 €                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Reverse 10% (apporteur_share_percentage)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPORTEUR REÇOIT                             │
│                         90 €                                  │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════╗
║  RÉSULTAT NET POUR CHACUN                                  ║
║  ─────────────────────────────────────────────────────────║
║  • Expert garde:     2,100 € (70% de 3,000€)              ║
║  • Profitum garde:     810 € (90% de 900€)                ║
║  • Apporteur reçoit:    90 € (10% de 900€)                ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🗄️ STRUCTURE BDD

### Table `Expert`
```sql
-- Colonnes renommées pour clarté
client_fee_percentage      NUMERIC(5,4) DEFAULT 0.30
  → % que le CLIENT paie à l'EXPERT

profitum_fee_percentage    NUMERIC(5,4) DEFAULT 0.30
  → % que l'EXPERT paie à PROFITUM
```

### Table `ApporteurAffaires`
```sql
-- Colonne renommée
profitum_share_percentage  NUMERIC(5,4) DEFAULT 0.10
  → % que PROFITUM reverse à l'APPORTEUR
```

### Table `invoice`
```sql
montant_remboursement       NUMERIC(10,2)  -- Base de calcul
client_fee_percentage       NUMERIC(5,4)   -- Taux client→expert
expert_total_fee            NUMERIC(10,2)   -- Montant client→expert
profitum_fee_percentage     NUMERIC(5,4)   -- Taux expert→profitum
profitum_total_fee          NUMERIC(10,2)   -- Montant expert→profitum
apporteur_share_percentage  NUMERIC(5,4)   -- Taux profitum→apporteur
apporteur_commission        NUMERIC(10,2)   -- Montant profitum→apporteur
amount                      NUMERIC(10,2)   -- = profitum_total_fee (HT)
```

---

## 💻 CALCUL DANS LE CODE

```typescript
// Service FactureService.generate()

// 1. Client → Expert
const expertTotalFee = montantRemboursement * client_fee_percentage;

// 2. Expert → Profitum
const profitumTotalFee = expertTotalFee * profitum_fee_percentage;

// 3. Profitum → Apporteur
const apporteurCommission = profitumTotalFee * apporteur_share_percentage;

// 4. TVA et TTC (sur ce que Profitum facture)
const tva = profitumTotalFee * 0.20;
const profitumTotalTTC = profitumTotalFee + tva;

// 5. Ce que garde chacun
const expertKeeps = expertTotalFee - profitumTotalFee;
const profitumKeeps = profitumTotalFee - apporteurCommission;
```

---

## 📋 EXEMPLE CONCRET

### Remboursement: 15,000 €

| Étape | Calcul | Montant |
|-------|--------|---------|
| 1️⃣ Client paie expert (30%) | 15,000 × 0.30 | **4,500 €** |
| 2️⃣ Expert paie Profitum (30%) | 4,500 × 0.30 | **1,350 €** |
| 3️⃣ Profitum reverse apporteur (10%) | 1,350 × 0.10 | **135 €** |
| TVA Profitum (20%) | 1,350 × 0.20 | **270 €** |
| **Facture Profitum TTC** | 1,350 + 270 | **1,620 €** |

### Répartition finale:
- **Expert garde:** 3,150 € (4,500 - 1,350)
- **Profitum garde:** 1,215 € (1,350 - 135)
- **Apporteur reçoit:** 135 €

---

## 🎯 AFFICHAGE MODAL CLIENT

Le client voit:

```
┌──────────────────────────────────────────────┐
│ 💼 Conditions de rémunération Profitum       │
├──────────────────────────────────────────────┤
│                                              │
│ Montant remboursement: 15,000 €             │
│                                              │
│ 1️⃣ Vous payez 30% à l'expert: 4,500 €       │
│ 2️⃣ L'expert paie 30% à Profitum: 1,350 €    │
│ 3️⃣ Profitum reverse 10% à l'apporteur: 135 €│
│                                              │
│ ─────────────────────────────────────────   │
│ Facture Profitum HT: 1,350 €                │
│ TVA (20%): 270 €                             │
│ Total TTC: 1,620 €                           │
│                                              │
│ ℹ️ Basée sur le montant RÉEL reçu           │
└──────────────────────────────────────────────┘
```

---

## ✅ MIGRATIONS À EXÉCUTER

```bash
# 1. Renommer colonnes + defaults
psql -f server/migrations/20250110_fix_commissions_v2.sql

# 2. Ajouter statuts workflow
psql -f server/migrations/20250110_add_workflow_statuses.sql
```

---

## 🔄 TIMELINE DES ÉVÉNEMENTS

1. **Client valide audit** → Enregistre conditions waterfall dans `metadata`
2. **Expert soumet dossier** → Timeline + notifs
3. **Expert saisit résultat final** → 🧾 **FACTURE AUTO GÉNÉRÉE** avec waterfall
4. **Client confirme paiement** → Dossier `completed`

---

## 📊 FICHIERS MODIFIÉS

### Backend:
- ✅ `server/src/services/facture-service.ts` - Calcul waterfall
- ✅ `server/src/routes/expert-dossier-actions.ts` - Routes + API responses
- ✅ `server/migrations/20250110_fix_commissions_v2.sql` - BDD

### Frontend:
- ⏳ `client/src/components/client/AuditValidationModal.tsx` - Affichage waterfall
- ⏳ `client/src/components/client/InvoiceDisplay.tsx` - Affichage facture
- ⏳ `client/src/components/expert/FinalResultModal.tsx` - Info génération

---

**Date création:** 2025-11-05  
**Version:** 2.0 (Waterfall correct)

