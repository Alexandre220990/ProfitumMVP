# Implémentation de la Détection des Bounces et Source Email Reply

## 📋 Résumé

Ce document décrit les modifications apportées pour résoudre l'erreur de contrainte CHECK sur la table `prospects` et implémenter un système complet de détection des bounces (emails non délivrés).

## ❌ Problème Initial

### Erreur rencontrée
```
code: '23514',
message: 'new row for relation "prospects" violates check constraint "prospects_source_check"'
```

**Cause** : Le système tentait de créer automatiquement un prospect avec `source: 'email_reply'`, mais cette valeur n'était pas autorisée par la contrainte CHECK de la base de données.

Les seules valeurs autorisées étaient :
- `'google_maps'`
- `'import_csv'`
- `'linkedin'`
- `'manuel'`

## ✅ Solution Implémentée

### 1. Ajout de `'email_reply'` comme source valide

#### Base de données (SQL)
```sql
-- Supprimer l'ancienne contrainte
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_source_check;

-- Créer la nouvelle contrainte avec email_reply
ALTER TABLE prospects ADD CONSTRAINT prospects_source_check 
  CHECK (source IN ('google_maps', 'import_csv', 'linkedin', 'manuel', 'email_reply'));
```

#### TypeScript (Backend)
**Fichier** : `server/src/types/prospects.ts`
```typescript
export type ProspectSource = 'google_maps' | 'import_csv' | 'linkedin' | 'manuel' | 'email_reply';
```

#### TypeScript (Frontend)
**Fichiers modifiés** :
- `client/src/pages/admin/prospection.tsx`
- `client/src/pages/admin/prospection/sequence/[sequenceId].tsx`

### 2. Détection des Bounces

#### Nouvelle méthode : `isBounceEmail()`
**Fichier** : `server/src/services/GmailService.ts`

Détecte automatiquement les emails de bounce en analysant :
- **L'expéditeur** : `mailer-daemon@`, `postmaster@`, etc.
- **Le sujet et le corps** : Extraction de l'email original qui a bounced
- **Le type de bounce** :
  - **Hard bounce** (permanent) : Email invalide, utilisateur inexistant
  - **Soft bounce** (temporaire) : Boîte pleine, problème temporaire

```typescript
private static isBounceEmail(fromEmail: string, subject: string, bodyText: string): {
  isBounce: boolean;
  originalRecipient?: string;
  bounceType?: 'hard' | 'soft';
  bounceReason?: string;
}
```

#### Intégration dans `fetchNewReplies()`

Lorsqu'un bounce est détecté, le système :

1. **Identifie le prospect** concerné via l'email original
2. **Met à jour tous les emails envoyés** :
   - `bounced: true`
   - `bounced_at: timestamp`
   - `metadata`: Ajout de `bounced_reason`, `bounced_type`, `bounce_detected_at`

3. **Met à jour le prospect** :
   - `emailing_status: 'bounced'`
   - `email_validity: 'invalid'` (hard bounce) ou `'risky'` (soft bounce)

4. **Annule les emails programmés** :
   - `status: 'cancelled'`
   - `metadata`: Raison de l'annulation avec détails du bounce

5. **Marque le message Gmail comme lu** et continue le traitement

### 3. Exclusion des Emails Système

**Fichier** : `server/src/services/GmailService.ts` - Méthode `createProspectFromEmail()`

Empêche la création automatique de prospects pour les emails système :
- `mailer-daemon@*`
- `postmaster@*`
- `noreply@*`
- `no-reply@*`
- `bounce@*`
- `bounces@*`
- `donotreply@*`
- `do-not-reply@*`

## 📊 Bénéfices

### 1. Traçabilité Améliorée
- Les prospects créés depuis des réponses email sont clairement identifiés (`source: 'email_reply'`)
- Distinction des sources pour analytics et reporting

### 2. Gestion Automatique des Bounces
- Détection en temps réel des emails non délivrés
- Mise à jour automatique des statuts
- Arrêt des séquences pour éviter d'envoyer à des emails invalides

### 3. Protection du Score d'Envoi
- Évite d'envoyer à des emails invalides (hard bounces)
- Réduit le taux de bounce
- Protège la réputation de l'expéditeur

### 4. Différenciation Hard/Soft Bounces
- **Hard bounces** : Email marqué comme `invalid` → Ne plus jamais envoyer
- **Soft bounces** : Email marqué comme `risky` → Possibilité de réessayer plus tard

### 5. Prévention Proactive
- Les emails système sont automatiquement exclus
- Pas de création de prospects inutiles
- Logs clairs pour le debugging

## 🔄 Flux de Traitement

### Réception d'un Email Gmail

```
1. Gmail API récupère l'email
   ↓
2. Extraction des informations (From, Subject, Body)
   ↓
3. ❓ Est-ce un bounce ?
   ├─ OUI → Détection du bounce
   │         ├─ Identification du prospect
   │         ├─ Mise à jour emails bounced
   │         ├─ Mise à jour statut prospect
   │         ├─ Annulation emails programmés
   │         └─ Marquer comme lu & STOP
   │
   └─ NON → Traitement normal de la réponse
             ├─ ❓ Est-ce un email système ?
             │   └─ OUI → Ignorer (pas de prospect créé)
             │
             ├─ Recherche prospect existant
             │   └─ Pas trouvé → Création auto (source: 'email_reply')
             │
             ├─ Stockage dans prospect_email_received
             ├─ Mise à jour status replied
             ├─ Arrêt de la séquence
             └─ Notification admin
```

## 📝 Fichiers Modifiés

### Backend
1. `server/src/types/prospects.ts`
   - Ajout de `'email_reply'` au type `ProspectSource`

2. `server/src/services/GmailService.ts`
   - Nouvelle méthode `isBounceEmail()`
   - Intégration détection bounce dans `fetchNewReplies()`
   - Validation emails système dans `createProspectFromEmail()`

### Frontend
1. `client/src/pages/admin/prospection.tsx`
   - Ajout de `'email_reply'` au type `source`

2. `client/src/pages/admin/prospection/sequence/[sequenceId].tsx`
   - Ajout de `'email_reply'` au type `source`

### Base de données
1. Migration SQL
   - Mise à jour de la contrainte `prospects_source_check`

## 🧪 Tests Recommandés

### Test 1 : Création Prospect depuis Réponse Email
1. Envoyer un email à un prospect non existant
2. Recevoir une réponse
3. Vérifier que le prospect est créé avec `source: 'email_reply'`

### Test 2 : Détection Hard Bounce
1. Envoyer un email à une adresse invalide
2. Attendre le bounce de `mailer-daemon@`
3. Vérifier :
   - Email marqué `bounced: true`
   - Prospect `emailing_status: 'bounced'`
   - Prospect `email_validity: 'invalid'`
   - Emails programmés annulés

### Test 3 : Détection Soft Bounce
1. Envoyer à une boîte pleine
2. Attendre le bounce
3. Vérifier :
   - Email marqué `bounced: true`
   - Prospect `email_validity: 'risky'` (pas `invalid`)

### Test 4 : Exclusion Emails Système
1. Simuler une réception depuis `noreply@example.com`
2. Vérifier qu'aucun prospect n'est créé
3. Vérifier le log : `⛔ Email système ignoré`

## 🔍 Surveillance et Logs

### Logs de Bounce
```
📩 Bounce détecté pour: user@example.com (Type: hard)
✅ Prospect [id] marqué comme bounced (hard)
```

### Logs d'Exclusion
```
⛔ Email système ignoré: mailer-daemon@googlemail.com
```

### Logs de Création Auto
```
📝 Création automatique d'un prospect pour user@example.com
✅ Prospect créé automatiquement: [id] (user@example.com)
```

## 📈 Métriques à Surveiller

1. **Taux de bounce global** : Doit rester < 5%
2. **Ratio hard/soft bounces** : Permet d'identifier des problèmes de qualité des données
3. **Prospects créés auto** : Mesure l'engagement des réponses entrantes
4. **Emails système bloqués** : Vérifier l'efficacité du filtre

## 🚀 Prochaines Améliorations

### Court Terme
1. Interface admin pour gérer manuellement les bounces
2. Notification email quand un prospect important bounce
3. Rapport hebdomadaire des bounces

### Moyen Terme
1. Intégration avec services de validation d'email (ZeroBounce, NeverBounce)
2. Retry automatique pour soft bounces après X jours
3. Machine learning pour détecter les patterns de bounce

### Long Terme
1. Intégration webhooks des providers d'email (Mailgun, SendGrid)
2. Système de réputation par domaine
3. Auto-nettoyage des listes basé sur le taux de bounce

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Consulter la table `prospects_emails` pour les détails des bounces
3. Vérifier la configuration Gmail API

---

**Date de création** : 4 décembre 2025
**Version** : 1.0
**Auteur** : AI Assistant (Claude)

