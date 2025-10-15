# 🤝 WORKFLOW : PROPOSITION D'EXPERT (Admin → Client)

## 🎯 Principe de base

**L'admin PROPOSE, le client DÉCIDE**

---

## 🔄 FLUX COMPLET

### **Étape 1 : Client upload documents pré-éligibilité**
```
Client upload KBIS + immatriculation
   ↓
Statut : documents_uploaded
   ↓
Notification → Admin (haute priorité)
```

---

### **Étape 2 : Admin valide pré-éligibilité**
```
Admin consulte documents
   ↓
Admin valide pré-éligibilité
   ↓
Statut : eligibility_validated + current_step = 2
   ↓
Notification → Client ("Félicitations ! Passez à l'étape suivante")
```

---

### **Étape 3 : Client sélectionne expert OU Admin propose expert**

#### **Option A : Client choisit lui-même (workflow normal)**
```
Client va sur son dossier
   ↓
Voit liste experts disponibles
   ↓
Client sélectionne expert
   ↓
Notification → Expert ("Vous avez été sélectionné")
Notification → Admin ("Client X a choisi expert Y")
```

#### **Option B : Admin propose un expert**
```
Admin va sur le dossier (page Dossiers)
   ↓
Admin clique "Proposer un expert"
   ↓
Modal : Liste experts disponibles
Admin sélectionne 1 expert
   ↓
Statut : expert_proposed (nouveau statut)
Metadata : { proposed_expert_id, proposed_by, proposed_at }
   ↓
Notification → Client :
   "L'expert [NOM] vous a été proposé pour votre dossier [PRODUIT].
    Vous pouvez accepter cette proposition ou choisir un autre expert."
   Actions : [Accepter] [Choisir autre expert]
```

---

### **Étape 4 : Client répond à la proposition**

#### **Si client ACCEPTE** :
```
Client clique "Accepter"
   ↓
Statut : en_cours + expert_id = proposed_expert_id
Metadata : { expert_accepted: true, accepted_at }
   ↓
Notification → Expert ("Nouveau dossier assigné")
Notification → Admin ("Client a accepté expert proposé")
```

#### **Si client CHOISIT AUTRE EXPERT** :
```
Client clique "Choisir autre expert"
   ↓
Client voit liste experts
Client sélectionne autre expert
   ↓
Statut : en_cours + expert_id = chosen_expert_id
Metadata : { expert_accepted: false, client_chose_other: true }
   ↓
Notification → Expert choisi ("Nouveau dossier assigné")
Notification → Expert proposé ("Proposition déclinée")
Notification → Admin ("Client a choisi autre expert")
```

---

## 🗄️ MODIFICATIONS BDD NÉCESSAIRES

### **Nouveaux statuts** :
```sql
-- À supporter dans ClientProduitEligible.statut
- 'expert_proposed'     -- Admin a proposé un expert, en attente réponse client
- 'expert_accepted'     -- Client a accepté expert proposé
- 'expert_declined'     -- Client a refusé et choisi autre expert
```

### **Métadonnées à ajouter** :
```typescript
metadata: {
  // Proposition expert
  proposed_expert_id?: string;
  proposed_by?: string;        // admin_id
  proposed_by_email?: string;
  proposed_at?: string;
  
  // Réponse client
  expert_accepted?: boolean;
  client_chose_other?: boolean;
  response_at?: string;
}
```

---

## 🎨 UX DANS L'INTERFACE

### **Page Admin - Dossiers**

```typescript
// Si dossier.statut === 'eligibility_validated' && !dossier.expert_id
<Button variant="outline" onClick={() => proposeExpert(dossier.id)}>
  💡 Proposer un expert
</Button>

// Si dossier.statut === 'expert_proposed'
<Badge className="bg-blue-100 text-blue-800">
  Expert proposé : {expert.name} - En attente réponse client
</Badge>
```

### **Page Client - Dossier**

```typescript
// Si statut === 'expert_proposed'
<Card className="border-blue-300 bg-blue-50">
  <CardTitle>💡 Expert proposé par nos équipes</CardTitle>
  <CardContent>
    <ExpertCard expert={proposedExpert} />
    <div className="flex gap-3 mt-4">
      <Button onClick={acceptProposedExpert}>
        ✅ Accepter cet expert
      </Button>
      <Button variant="outline" onClick={showOtherExperts}>
        🔍 Choisir un autre expert
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 📋 IMPLÉMENTATION TECHNIQUE

### **1. Route admin : Proposer expert**
```typescript
// POST /api/admin/dossiers/:id/propose-expert
{
  expert_id: string,
  notes?: string  // Message pour le client
}

// Update :
- statut: 'expert_proposed'
- metadata.proposed_expert_id
- Notification client
```

### **2. Route client : Répondre à proposition**
```typescript
// POST /api/client/produits-eligibles/:id/respond-expert-proposal
{
  action: 'accept' | 'decline',
  chosen_expert_id?: string  // Si decline et choisit autre
}

// Update selon action
// Notifications
```

---

## ✅ AVANTAGES DE CE WORKFLOW

1. **Respect du choix client** : Pas d'imposition
2. **Gain de temps** : Admin peut faciliter si client hésite
3. **Suivi clair** : On sait si proposition acceptée ou non
4. **Meilleure conversion** : Guidance admin tout en gardant autonomie client

---

## 🎯 PROCHAINE ÉTAPE

**Voulez-vous que j'implémente** :

**Option 1** : D'abord créer page Produits (indépendant, sans risque)
**Option 2** : D'abord implémenter le workflow "Proposer expert" (fonctionnalité nouvelle)
**Option 3** : D'abord enrichir Documents avec consultation/download/delete

**Quelle priorité ?** 🚀

