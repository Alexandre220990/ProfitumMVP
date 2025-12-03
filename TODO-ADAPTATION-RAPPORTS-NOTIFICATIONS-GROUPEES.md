# 📋 TODO - Adaptation des Rapports Matinal et du Soir au Système de Notifications Groupées

**Date** : 3 Décembre 2025  
**Priorité** : Moyenne  
**Statut** : À implémenter

---

## 🎯 **OBJECTIF**

Adapter les rapports du matin et du soir pour qu'ils affichent les notifications groupées par client au lieu des notifications individuelles.

**Avant** :
```
Actions du jour (25 actions)
- 📄 Documents à valider - DFS (Client: Transport Dupont)
- 📄 Documents à valider - TICPE (Client: Transport Dupont)
- 📄 Documents à valider - MSA (Client: Transport Dupont)
- 📄 Documents à valider - FONCIER (Client: Transport Dupont)
- 📄 Documents à valider - Logiciel Solid (Client: Transport Dupont)
...
```

**Après** :
```
Actions du jour (8 clients)
- 📋 Transport Dupont - 5 dossiers à traiter
  └─ DFS, TICPE, MSA, FONCIER, Logiciel Solid
- 📋 Test SARL - 2 dossiers à traiter
  └─ Chronotachygraphes, FONCIER
...
```

---

## 📁 **FICHIERS À MODIFIER**

### **1. Rapport Matinal**
**Fichier** : `server/src/services/morning-report-service.ts`

**Modifications nécessaires** :

```typescript
// AVANT (ligne ~176-189)
const { data: unreadNotificationsRaw } = await supabase
  .from('notification')
  .select('id, title, message, notification_type, priority, created_at, is_read, action_url, action_data, metadata')
  .eq('user_type', 'admin')
  .eq('is_read', false)
  .neq('notification_type', 'rdv_reminder')
  .in('priority', ['high', 'urgent'])
  .gte('created_at', twentyFourHoursAgo.toISOString());

// APRÈS
const { data: unreadNotificationsRaw } = await supabase
  .from('notification')
  .select('id, title, message, notification_type, priority, created_at, is_read, action_url, action_data, metadata, is_parent, children_count')
  .eq('user_type', 'admin')
  .eq('is_read', false)
  .eq('hidden_in_list', false)  // ⬅️ NOUVEAU : Exclure les enfants masqués
  .neq('notification_type', 'rdv_reminder')
  .in('priority', ['high', 'urgent'])
  .gte('created_at', twentyFourHoursAgo.toISOString());
```

**Template HTML** (ligne ~400-600) :

```typescript
// Affichage des notifications non lues
${notification.is_parent ? `
  <div class="notification-group-parent">
    <div class="notification-header">${notification.title}</div>
    <div class="notification-message">${notification.message}</div>
    <div class="notification-badge">${notification.children_count} dossier(s)</div>
    <a href="${notification.action_url}">Voir tous les dossiers →</a>
  </div>
` : `
  <div class="notification-item">
    <div class="notification-header">${notification.title}</div>
    <div class="notification-message">${notification.message}</div>
  </div>
`}
```

---

### **2. Rapport du Soir**
**Fichier** : `server/src/services/daily-activity-report-service-v2.ts`

**Modifications nécessaires** :

```typescript
// Méthode getPendingActions() (ligne ~148-300)

// AVANT : Récupère chaque dossier individuellement
for (const dossier of pendingDocs) {
  actions.push({
    type: 'document_validation',
    title: `Documents à valider - ${produit?.nom || 'Dossier'}`,
    description: `Dossier ${produit?.nom || 'N/A'} - Client ${client?.company_name || client?.name || 'N/A'}`,
    priority: 'high',
    link: SecureLinkService.generateSimpleLink(`/admin/dossiers/${dossier.id}`)
  });
}

// APRÈS : Grouper par client
const groupedByClient = pendingDocs.reduce((acc, dossier) => {
  const client = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
  const clientId = client?.id;
  
  if (!clientId) return acc;
  
  if (!acc[clientId]) {
    acc[clientId] = {
      client_id: clientId,
      client_name: client.company_name || client.name,
      dossiers: []
    };
  }
  
  acc[clientId].dossiers.push(dossier);
  return acc;
}, {});

// Créer une action groupée par client
for (const [clientId, data] of Object.entries(groupedByClient)) {
  const dossiersNames = data.dossiers
    .slice(0, 3)
    .map(d => d.ProduitEligible?.nom || 'Dossier')
    .join(', ');
  const moreCount = data.dossiers.length > 3 ? ` +${data.dossiers.length - 3}` : '';
  
  actions.push({
    type: 'document_validation',
    title: `Documents à valider - ${data.client_name}`,
    description: `${data.dossiers.length} dossier(s) : ${dossiersNames}${moreCount}`,
    priority: 'high',
    link: SecureLinkService.generateSimpleLink(`/admin/clients/${clientId}`),
    metadata: { 
      client_id: clientId,
      dossiers_count: data.dossiers.length 
    }
  });
}
```

**Template HTML** (ligne ~690-720) :

```typescript
// Afficher les actions groupées
${reportData.pendingActions.map(action => {
  const priorityStyle = priorityColors[action.priority];
  const isGrouped = action.metadata?.dossiers_count > 1;
  
  return `
    <div class="action-item" style="border-left-color: ${priorityStyle.border}; background: ${priorityStyle.bg};">
      <div class="action-header">
        <div class="action-icon">${getActionIcon(action.type)}</div>
        <div class="action-title">${action.title}</div>
        ${isGrouped ? `<div class="action-badge">${action.metadata.dossiers_count} dossiers</div>` : ''}
        <div class="action-priority" style="background: ${priorityStyle.border}; color: white;">
          ${action.priority}
        </div>
      </div>
      <div class="action-description" style="color: ${priorityStyle.text};">
        ${action.description}
      </div>
      <a href="${action.link}" class="action-link">Voir les détails →</a>
    </div>
  `;
}).join('')}
```

---

## 🔧 **IMPLÉMENTATION RECOMMANDÉE**

### **Phase 1 : Rapport du Soir** (Plus simple)
1. Modifier `getPendingActions()` pour grouper par client
2. Adapter le template HTML
3. Tester avec données réelles
4. Déployer

### **Phase 2 : Rapport Matinal** (Plus complexe)
1. Modifier la récupération des notifications non lues
2. Ajouter filtres `hidden_in_list = false`
3. Afficher les parents avec compteur
4. Tester et déployer

---

## 📊 **IMPACT ATTENDU**

### **Rapport du Soir**

**Avant** :
```
⚡ Actions du jour (25)
- Documents à valider - DFS
- Documents à valider - TICPE
- Documents à valider - MSA
...
[25 lignes dans l'email]
```

**Après** :
```
⚡ Actions du jour (8 clients)
- 📋 Transport Dupont - 5 dossiers (DFS, TICPE, MSA +2)
- 📋 Test SARL - 2 dossiers (Chronotachygraphes, FONCIER)
...
[8 lignes dans l'email - 70% plus court]
```

### **Rapport Matinal**

**Avant** :
```
📋 Notifications urgentes non lues (30)
[Liste de 30 notifications individuelles]
```

**Après** :
```
📋 Notifications urgentes non lues (12 groupes)
[Liste de 12 notifications parent avec détails]
```

---

## ⚠️ **POINTS D'ATTENTION**

1. **Liens vers actions** :
   - Parent → `/admin/clients/{client_id}` (vue client globale)
   - Enfant → `/admin/dossiers/{dossier_id}` (dossier spécifique)

2. **Priorité du groupe** :
   - Basée sur la plus élevée des enfants
   - Si un enfant urgent → parent urgent

3. **Badge SLA** :
   - Basé sur le plus ancien des dossiers
   - Affichage cohérent avec le centre de notifications

4. **Compteurs** :
   - "X dossiers" au lieu de "X actions"
   - Badge avec nombre visible

---

## ✅ **CHECKLIST D'IMPLÉMENTATION**

### **Rapport du Soir**
- [ ] Modifier `getPendingActions()` pour grouper par client
- [ ] Adapter template HTML pour afficher groupes
- [ ] Tester avec données réelles
- [ ] Vérifier que liens fonctionnent
- [ ] Déployer

### **Rapport Matinal**
- [ ] Modifier requête notifications pour filtrer `hidden_in_list`
- [ ] Adapter template HTML pour parents
- [ ] Afficher compteur enfants
- [ ] Tester avec données réelles
- [ ] Déployer

---

## 📚 **RÉFÉRENCES**

- Service d'agrégation : `notification-aggregation-service.ts`
- Template de groupement : `NotificationGroup.tsx` (frontend)
- Documentation complète : `SYSTEME-NOTIFICATIONS-GROUPEES-FINAL.md`

---

## 🎯 **PRIORITÉ**

**Moyenne** - Amélioration UX des rapports email

**Avantages** :
- ✅ Emails plus courts et lisibles
- ✅ Vision claire par client
- ✅ Cohérence avec l'interface web

**Effort estimé** : 2-3 heures de développement

---

**À implémenter quand** : Prochaine session de développement  
**Bloquant pour production** : ❌ NON (système actuel fonctionne)  
**Recommandé** : ✅ OUI (améliore significativement l'UX)

