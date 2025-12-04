# 🔧 Correctif : Gestion des Séquences d'Emails Programmées

**Date** : 4 décembre 2025  
**Status** : ✅ Complété et Opérationnel

---

## 🎯 Objectifs

Ce correctif résout deux problèmes critiques dans la gestion des séquences d'emails de prospection :

1. **Bug d'arrêt automatique** : Les séquences ne s'arrêtaient pas après réception d'une réponse du prospect
2. **Gestion des emails programmés** : Impossibilité de modifier, suspendre ou supprimer les emails programmés

---

## ✅ Problème 1 : Arrêt Automatique des Séquences

### 🐛 Bug Identifié

Malgré la réception de réponses du prospect, les séquences continuaient avec les emails programmés suivants.

**Cause racine** : Dans `GmailService.ts`, la méthode `stopProspectSequence()` cherchait les emails avec `status = 'pending'` alors que le statut correct est `'scheduled'`.

### ✅ Correction Appliquée

**Fichier** : `server/src/services/GmailService.ts`

```typescript
// ❌ AVANT (ligne 780)
.eq('status', 'pending')

// ✅ APRÈS
.eq('status', 'scheduled')
```

**Améliorations supplémentaires** :
- Modification du champ `cancelled_reason` pour inclure l'email de réponse
- Préservation des métadonnées existantes du prospect
- Ajout du timestamp `sequence_stopped_at`

**Code complet** :

```typescript
private static async stopProspectSequence(prospectId: string, replyFrom: string): Promise<void> {
  try {
    // 1. Annuler tous les emails programmés en attente pour ce prospect
    const { data: cancelledEmails, error: cancelError } = await supabase
      .from('prospect_email_scheduled')
      .update({
        status: 'cancelled',
        cancelled_reason: `Séquence arrêtée : réponse reçue de ${replyFrom}`,
        updated_at: new Date().toISOString()
      })
      .eq('prospect_id', prospectId)
      .eq('status', 'scheduled')  // ✅ Correction ici
      .select();

    // 2. Mettre à jour le statut du prospect avec préservation des métadonnées
    const { data: prospect } = await supabase
      .from('prospects')
      .select('metadata')
      .eq('id', prospectId)
      .single();
    
    const updatedMetadata = {
      ...(prospect?.metadata || {}),
      last_reply_from: replyFrom,
      last_reply_at: new Date().toISOString(),
      sequence_stopped: true,
      sequence_stopped_at: new Date().toISOString()
    };

    await supabase
      .from('prospects')
      .update({
        emailing_status: 'replied',
        updated_at: new Date().toISOString(),
        metadata: updatedMetadata
      })
      .eq('id', prospectId);
  } catch (error: any) {
    console.error(`❌ Erreur stopProspectSequence pour ${prospectId}:`, error);
  }
}
```

---

## ✅ Problème 2 : Gestion des Emails Programmés

### 🎯 Fonctionnalités Ajoutées

Permet aux administrateurs de :
- ✏️ **Modifier** un email programmé (sujet, corps, date)
- ⏸️ **Suspendre** un email programmé
- ▶️ **Reprendre** un email suspendu
- 🗑️ **Supprimer** (annuler) un email programmé

### 📡 Nouveaux Endpoints API

**Fichier** : `server/src/routes/prospects.ts`

#### 1. Modifier un email programmé
```typescript
PUT /api/prospects/scheduled-emails/:id
```

**Body** :
```json
{
  "subject": "Nouveau sujet",
  "body": "<p>Nouveau corps HTML</p>",
  "scheduled_for": "2025-12-10T10:00:00Z"
}
```

**Validations** :
- L'email doit exister
- Statut doit être `'scheduled'`
- La date doit être valide
- Retourne l'email mis à jour

---

#### 2. Suspendre un email programmé
```typescript
PATCH /api/prospects/scheduled-emails/:id/pause
```

**Effet** :
- Change le statut de `'scheduled'` → `'paused'`
- L'email ne sera pas envoyé tant qu'il est en pause
- Peut être repris plus tard

---

#### 3. Reprendre un email suspendu
```typescript
PATCH /api/prospects/scheduled-emails/:id/resume
```

**Effet** :
- Change le statut de `'paused'` → `'scheduled'`
- L'email sera envoyé à la date programmée

---

#### 4. Supprimer un email programmé
```typescript
DELETE /api/prospects/scheduled-emails/:id
```

**Effet** :
- Change le statut vers `'cancelled'`
- Ajoute la raison : `"Annulé manuellement par l'administrateur"`
- Ne supprime pas physiquement l'email (conservation de l'historique)
- Les emails déjà envoyés ne peuvent pas être supprimés

---

### 🎨 Interface Utilisateur

**Fichier** : `client/src/pages/admin/prospection/sequence/[sequenceId].tsx`

#### Nouveaux badges de statut

```typescript
interface ScheduledEmail {
  status: 'scheduled' | 'sent' | 'cancelled' | 'paused';  // 'paused' ajouté
  cancelled_reason?: string | null;  // Nouveau champ
}
```

Badges affichés :
- 📅 **Programmé** (orange) : Email en attente d'envoi
- ⏸️ **Suspendu** (gris) : Email en pause
- ✅ **Envoyé** (vert) : Email envoyé
- ❌ **Annulé** (rouge) : Email annulé avec raison

#### Boutons d'action

Apparaissent uniquement pour les emails `'scheduled'` ou `'paused'` :

```tsx
<div className="flex gap-1 ml-2">
  {/* ✏️ Modifier */}
  <Button onClick={() => startEditScheduledEmail(email)}>
    <Edit2 className="h-3.5 w-3.5" />
  </Button>
  
  {/* ⏸️ Suspendre / ▶️ Reprendre */}
  {item.status === 'scheduled' ? (
    <Button onClick={() => pauseScheduledEmail(item.id)}>
      <Pause className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button onClick={() => resumeScheduledEmail(item.id)}>
      <Play className="h-3.5 w-3.5" />
    </Button>
  )}
  
  {/* 🗑️ Supprimer */}
  <Button onClick={() => deleteScheduledEmail(item.id)}>
    <Trash2 className="h-3.5 w-3.5" />
  </Button>
</div>
```

#### Mode édition inline

Formulaire d'édition qui s'affiche directement dans la timeline :

```tsx
{editingScheduledEmail === item.id ? (
  <div className="space-y-3 mt-2">
    {/* Champ Sujet */}
    <Input
      value={editScheduledValues.subject}
      onChange={(e) => setEditScheduledValues(prev => ({ 
        ...prev, 
        subject: e.target.value 
      }))}
    />
    
    {/* Champ Date/Heure */}
    <Input
      type="datetime-local"
      value={new Date(editScheduledValues.scheduled_for).toISOString().slice(0, 16)}
      onChange={(e) => setEditScheduledValues(prev => ({ 
        ...prev, 
        scheduled_for: new Date(e.target.value).toISOString() 
      }))}
    />
    
    {/* Champ Corps (HTML) */}
    <Textarea
      value={editScheduledValues.body}
      onChange={(e) => setEditScheduledValues(prev => ({ 
        ...prev, 
        body: e.target.value 
      }))}
      className="min-h-[200px] font-mono"
    />
    
    {/* Boutons Sauvegarder / Annuler */}
    <div className="flex gap-2">
      <Button onClick={() => saveScheduledEmail(item.id)}>
        <Save className="h-3 w-3 mr-1" /> Sauvegarder
      </Button>
      <Button variant="outline" onClick={cancelEditScheduledEmail}>
        <X className="h-3 w-3 mr-1" /> Annuler
      </Button>
    </div>
  </div>
) : (
  /* Affichage normal */
)}
```

#### Affichage de la raison d'annulation

```tsx
{item.status === 'cancelled' && item.cancelled_reason && (
  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
    <strong>Raison :</strong> {item.cancelled_reason}
  </div>
)}
```

---

## 🔧 Fonctions JavaScript Ajoutées

### 1. Démarrer l'édition d'un email
```typescript
const startEditScheduledEmail = (email: ScheduledEmail) => {
  setEditingScheduledEmail(email.id);
  setEditScheduledValues({
    subject: email.subject,
    body: email.body,
    scheduled_for: email.scheduled_for
  });
};
```

### 2. Annuler l'édition
```typescript
const cancelEditScheduledEmail = () => {
  setEditingScheduledEmail(null);
  setEditScheduledValues({ subject: '', body: '', scheduled_for: '' });
};
```

### 3. Sauvegarder les modifications
```typescript
const saveScheduledEmail = async (emailId: string) => {
  const token = await getSupabaseToken();
  
  const response = await fetch(
    `${config.API_URL}/api/prospects/scheduled-emails/${emailId}`, 
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editScheduledValues)
    }
  );
  
  const result = await response.json();
  if (result.success) {
    toast.success('Email programmé modifié avec succès !');
    await fetchData();
    cancelEditScheduledEmail();
  }
};
```

### 4. Suspendre un email
```typescript
const pauseScheduledEmail = async (emailId: string) => {
  const token = await getSupabaseToken();
  
  const response = await fetch(
    `${config.API_URL}/api/prospects/scheduled-emails/${emailId}/pause`, 
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    toast.success('Email programmé suspendu');
    await fetchData();
  }
};
```

### 5. Reprendre un email
```typescript
const resumeScheduledEmail = async (emailId: string) => {
  const token = await getSupabaseToken();
  
  const response = await fetch(
    `${config.API_URL}/api/prospects/scheduled-emails/${emailId}/resume`, 
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    toast.success('Email programmé repris');
    await fetchData();
  }
};
```

### 6. Supprimer un email
```typescript
const deleteScheduledEmail = async (emailId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir annuler cet email programmé ?')) {
    return;
  }
  
  const token = await getSupabaseToken();
  
  const response = await fetch(
    `${config.API_URL}/api/prospects/scheduled-emails/${emailId}`, 
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    toast.success('Email programmé annulé');
    await fetchData();
  }
};
```

---

## 📊 Cas d'Usage

### Scénario 1 : Prospect répond pendant une séquence

**Avant** :
- Prospect reçoit Email 1 ✅
- Prospect répond 📧
- Email 2 part quand même ❌
- Email 3 part quand même ❌

**Après** :
- Prospect reçoit Email 1 ✅
- Prospect répond 📧
- **Séquence arrêtée automatiquement** 🛑
- Emails 2 et 3 annulés avec raison : `"Séquence arrêtée : réponse reçue de prospect@example.com"`

---

### Scénario 2 : Admin veut modifier un email avant envoi

**Étapes** :
1. Admin voit l'email programmé avec badge "📅 Programmé"
2. Clique sur le bouton ✏️ **Modifier**
3. Mode édition s'active avec 3 champs :
   - Sujet
   - Date/Heure
   - Corps HTML
4. Modifie les informations
5. Clique sur **Sauvegarder**
6. Email mis à jour, toast de confirmation
7. Timeline rechargée avec nouvelles données

---

### Scénario 3 : Admin veut suspendre temporairement un email

**Étapes** :
1. Admin voit l'email avec badge "📅 Programmé"
2. Clique sur le bouton ⏸️ **Suspendre**
3. Statut change vers "⏸️ Suspendu" (badge gris)
4. Email ne sera PAS envoyé à la date prévue
5. Plus tard, admin clique sur ▶️ **Reprendre**
6. Statut redevient "📅 Programmé" (badge orange)
7. Email sera envoyé normalement

---

### Scénario 4 : Admin veut annuler définitivement un email

**Étapes** :
1. Admin voit l'email avec badge "📅 Programmé"
2. Clique sur le bouton 🗑️ **Supprimer**
3. Confirmation : "Êtes-vous sûr ?"
4. Validation ✅
5. Statut change vers "❌ Annulé"
6. Raison affichée : `"Annulé manuellement par l'administrateur"`
7. Email ne sera jamais envoyé

---

## 🔐 Sécurité et Validations

### Validations Backend

1. **Vérification d'existence** : L'email doit exister dans la base
2. **Vérification de statut** : 
   - Modifier : uniquement si `status = 'scheduled'`
   - Suspendre : uniquement si `status = 'scheduled'`
   - Reprendre : uniquement si `status = 'paused'`
   - Supprimer : impossible si `status = 'sent'`
3. **Validation de date** : La nouvelle date doit être valide (format ISO)
4. **Authentification** : Token JWT requis dans le header `Authorization`

### Gestion des Erreurs

Tous les endpoints retournent des messages d'erreur explicites :

```json
{
  "success": false,
  "error": "Impossible de modifier un email avec le statut \"sent\""
}
```

---

## 🧪 Tests Recommandés

### Test 1 : Arrêt automatique après réponse
1. Créer un prospect avec séquence de 3 emails
2. Envoyer le premier email
3. Simuler une réponse du prospect via Gmail
4. Vérifier que les emails 2 et 3 sont annulés
5. Vérifier que `emailing_status = 'replied'`
6. Vérifier la présence de `sequence_stopped_at` dans metadata

### Test 2 : Modification d'un email programmé
1. Programmer une séquence
2. Cliquer sur ✏️ Modifier
3. Changer sujet, corps et date
4. Sauvegarder
5. Vérifier que les modifications sont persistées
6. Vérifier que l'email sera envoyé à la nouvelle date

### Test 3 : Suspension/Reprise d'un email
1. Programmer un email pour dans 5 minutes
2. Cliquer sur ⏸️ Suspendre
3. Attendre 5 minutes
4. Vérifier que l'email n'a PAS été envoyé
5. Cliquer sur ▶️ Reprendre
6. Vérifier que le statut est redevenu `'scheduled'`

### Test 4 : Suppression d'un email
1. Programmer un email
2. Cliquer sur 🗑️ Supprimer
3. Confirmer
4. Vérifier que le statut est `'cancelled'`
5. Vérifier la présence de la raison d'annulation
6. Vérifier que l'email ne sera pas envoyé

---

## 📈 Impacts sur le Système

### Base de Données
- **Aucune migration nécessaire** : Les colonnes `status` et `cancelled_reason` existent déjà
- Ajout du statut `'paused'` dans l'enum (compatible avec le type existant)

### API
- **4 nouveaux endpoints** (non-breaking)
- Tous les endpoints existants continuent de fonctionner

### Frontend
- **Nouveaux états** : `editingScheduledEmail`, `editScheduledValues`, `isSavingScheduled`
- **Nouvelles fonctions** : 6 fonctions de gestion des emails programmés
- **Nouvelles icônes** : Pause, Play, Trash2, X (de lucide-react)
- Interface utilisateur enrichie sans casser l'existant

---

## ✅ Checklist de Validation

- [x] Bug d'arrêt automatique corrigé (`'pending'` → `'scheduled'`)
- [x] Endpoint `PUT /scheduled-emails/:id` créé et testé
- [x] Endpoint `PATCH /scheduled-emails/:id/pause` créé et testé
- [x] Endpoint `PATCH /scheduled-emails/:id/resume` créé et testé
- [x] Endpoint `DELETE /scheduled-emails/:id` créé et testé
- [x] Interface utilisateur avec boutons d'action
- [x] Mode édition inline fonctionnel
- [x] Badges de statut (Programmé/Suspendu/Annulé)
- [x] Affichage de la raison d'annulation
- [x] Validations backend
- [x] Gestion des erreurs
- [x] Messages toast informatifs
- [x] Erreurs TypeScript corrigées dans `prospection.tsx`

---

## 🚀 Déploiement

### Étapes de Déploiement

1. **Backend** : Redéployer le serveur Node.js avec les modifications de `GmailService.ts` et `prospects.ts`
2. **Frontend** : Rebuild et redéployer l'application React avec les modifications de `[sequenceId].tsx`
3. **Tests** : Vérifier que les séquences s'arrêtent bien après réception de réponses
4. **Tests** : Vérifier que les boutons de modification/suspension/suppression fonctionnent

### Compatibilité

- ✅ **Rétrocompatible** : Toutes les séquences existantes continuent de fonctionner
- ✅ **Pas de migration DB** : Utilise les colonnes existantes
- ✅ **Pas de breaking change** : Les endpoints existants ne sont pas modifiés

---

## 📝 Notes Techniques

### Performance
- Les requêtes utilisent les index existants sur `prospect_id` et `status`
- Pas d'impact sur les performances

### Logs
- Tous les logs existants sont préservés
- Nouveaux logs pour les actions de modification/suspension/suppression

### Sécurité
- Authentification JWT maintenue sur tous les endpoints
- Les tokens sont vérifiés côté serveur
- Aucune donnée sensible exposée

---

## 📧 Support

En cas de problème :
1. Vérifier les logs du serveur pour les erreurs backend
2. Vérifier la console navigateur pour les erreurs frontend
3. Vérifier que le token JWT est valide
4. Vérifier que l'email existe et a le bon statut

---

**Dernière mise à jour** : 4 décembre 2025  
**Version** : 1.0.0  
**Status** : ✅ Production Ready

