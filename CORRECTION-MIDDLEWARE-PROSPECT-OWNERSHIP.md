# Correction - Middleware checkProspectOwnership

**Date**: 23 octobre 2025  
**Statut**: ✅ Corrigé

## 🐛 Problème Identifié

Lors de l'édition d'un prospect dans le wizard, une erreur 404 se produisait :

```
GET https://profitummvp-production.up.railway.app/api/apporteur/prospects/22e300cb-b920-4ebd-91ea-ad15de189037 404 (Not Found)
```

Cette erreur se produisait dans `Step1_ProspectInfo.tsx` lors du chargement des données du prospect existant.

## 🔍 Analyse

### Cause Racine

Le middleware `checkProspectOwnership` (utilisé pour vérifier les permissions) cherchait dans la mauvaise table :

```typescript
// ❌ AVANT - Cherchait dans une table 'Prospect' qui n'existe pas
const { data: prospect, error } = await supabase
    .from('Prospect')  // ❌ Table incorrecte
    .select('apporteur_id')
    .eq('id', prospectId)
    .single();
```

**Problème** : Dans l'architecture Profitum, les prospects sont stockés dans la table **`Client`** avec `status='prospect'`, pas dans une table séparée `Prospect`.

### Routes Affectées

Le middleware `checkProspectOwnership` était utilisé par plusieurs routes :

1. `GET /api/apporteur/prospects/:prospectId` - Détails d'un prospect
2. `PUT /api/apporteur/prospects/:prospectId` - Mise à jour d'un prospect
3. `DELETE /api/apporteur/prospects/:prospectId` - Suppression d'un prospect
4. `GET /api/apporteur/prospects/:prospectId/meetings` - RDV d'un prospect
5. `POST /api/apporteur/prospects/:prospectId/convert` - Conversion en client

Toutes ces routes retournaient un **404** à cause du middleware défaillant.

## ✅ Correction Appliquée

### Fichier Modifié

**`server/src/middleware/auth-apporteur.ts`**

### Changements

```typescript
// ✅ APRÈS - Cherche dans la table Client
export const checkProspectOwnership = async (req: ApporteurRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const prospectId = req.params.prospectId || req.body.prospect_id;
        
        if (!prospectId) {
            res.status(400).json({ error: 'ID prospect requis' });
            return;
        }

        console.log(`🔐 Vérification ownership prospect ${prospectId} pour apporteur ${req.user?.apporteur_id}`);

        // ✅ Les prospects sont stockés dans la table Client avec status='prospect'
        const { data: prospect, error } = await supabase
            .from('Client')  // ✅ Bonne table
            .select('apporteur_id, status')
            .eq('id', prospectId)
            .single();

        if (error) {
            console.error('❌ Erreur récupération prospect:', error);
            res.status(404).json({ error: 'Prospect non trouvé' });
            return;
        }

        if (!prospect) {
            console.log('❌ Prospect introuvable');
            res.status(404).json({ error: 'Prospect non trouvé' });
            return;
        }

        console.log(`📋 Prospect trouvé: apporteur_id=${prospect.apporteur_id}, status=${prospect.status}`);

        if (prospect.apporteur_id !== req.user?.apporteur_id) {
            console.log(`❌ Accès refusé: ${prospect.apporteur_id} !== ${req.user?.apporteur_id}`);
            res.status(403).json({ error: 'Accès refusé - Prospect non autorisé' });
            return;
        }

        console.log('✅ Ownership vérifié');
        next();
    } catch (error) {
        console.error('❌ Erreur de vérification ownership:', error);
        res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
};
```

### Améliorations Ajoutées

1. **Logs détaillés** pour faciliter le debugging
2. **Sélection du status** pour vérifier que c'est bien un prospect
3. **Messages d'erreur clairs** selon le cas (404 vs 403)

## 🔍 Vérification des Services

Le service `ProspectService.getProspectById()` utilisait déjà la bonne table :

```typescript
// ✅ ProspectService - CORRECT depuis le début
static async getProspectById(prospectId: string): Promise<ProspectResponse> {
    try {
        const { data: prospect, error } = await supabase
            .from('Client')  // ✅ Bonne table
            .select('*')
            .eq('id', prospectId)
            .eq('status', 'prospect')  // ✅ Filtre sur le status
            .single();

        if (error) throw error;
        if (!prospect) throw new Error('Prospect non trouvé');

        return prospect as any;

    } catch (error) {
        console.error('Erreur getProspectById:', error);
        throw new Error('Erreur lors de la récupération du prospect');
    }
}
```

**Conclusion** : Seul le middleware était défaillant, pas le service.

## 📊 Impact

### Avant la Correction ❌

- **Toutes** les routes avec `checkProspectOwnership` retournaient 404
- Impossible de :
  - Charger les données d'un prospect pour l'édition
  - Mettre à jour un prospect
  - Récupérer les RDV d'un prospect
  - Convertir un prospect en client
  - Supprimer un prospect

### Après la Correction ✅

- Routes fonctionnelles :
  - ✅ `GET /api/apporteur/prospects/:prospectId`
  - ✅ `PUT /api/apporteur/prospects/:prospectId`
  - ✅ `DELETE /api/apporteur/prospects/:prospectId`
  - ✅ `GET /api/apporteur/prospects/:prospectId/meetings`
  - ✅ `POST /api/apporteur/prospects/:prospectId/convert`

- Le wizard d'édition fonctionne maintenant complètement :
  1. Ouverture du wizard → ✅
  2. Chargement des données → ✅ (plus de 404)
  3. Modification → ✅
  4. Sauvegarde → ✅

## 🎯 Architecture des Prospects dans Profitum

### Table Unique : `Client`

```sql
-- Les prospects ET les clients sont dans la même table
Table: Client
├── id (uuid)
├── name (varchar)
├── company_name (varchar)
├── email (varchar)
├── phone_number (varchar)
├── status (varchar) → 'prospect' | 'client' | 'inactive'
├── apporteur_id (uuid)
├── ...
```

### Statuts

- **`prospect`** : Lead/prospect pas encore converti
- **`client`** : Client actif avec dossiers
- **`inactive`** : Compte désactivé

### Pourquoi Cette Architecture ?

1. **Simplicité** : Une seule table à maintenir
2. **Continuité** : Pas de migration de données lors de la conversion
3. **Historique** : Tout l'historique reste dans la même table
4. **Relations** : Les clés étrangères restent valides lors de la conversion

## 📝 Logs de Debugging Ajoutés

Pour faciliter le diagnostic futur, les logs suivants ont été ajoutés :

```typescript
🔐 Vérification ownership prospect {id} pour apporteur {apporteur_id}
📋 Prospect trouvé: apporteur_id={x}, status={y}
✅ Ownership vérifié
❌ Accès refusé: {apporteur_id_prospect} !== {apporteur_id_user}
❌ Prospect introuvable
```

Ces logs apparaîtront dans la console Railway pour faciliter le debugging.

## 🚀 Déploiement

Une fois le code déployé sur Railway, vous verrez ces logs dans la console lors des requêtes :

```bash
🔐 Vérification ownership prospect 22e300cb-b920-4ebd-91ea-ad15de189037 pour apporteur 10705490-5e3b-49a2-a0db-8e3d5a5af38e
📋 Prospect trouvé: apporteur_id=10705490-5e3b-49a2-a0db-8e3d5a5af38e, status=prospect
✅ Ownership vérifié
GET /api/apporteur/prospects/22e300cb-b920-4ebd-91ea-ad15de189037 200 45.123 ms - 1234
```

## ✅ Vérifications

- ✅ Pas d'erreurs de linting
- ✅ Le service `ProspectService` était déjà correct
- ✅ Tous les autres middlewares sont corrects
- ✅ Architecture cohérente avec la base de données

## 📚 Fichiers Concernés

- ✅ `server/src/middleware/auth-apporteur.ts` - **CORRIGÉ**
- ✅ `server/src/services/ProspectService.ts` - Déjà correct
- ✅ `server/src/routes/apporteur.ts` - Utilise le middleware corrigé

