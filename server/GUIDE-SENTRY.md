# 🎯 Guide Sentry - Monitoring des Notifications

## 📋 Qu'est-ce que Sentry ?

**Sentry** est une plateforme de monitoring d'erreurs en temps réel qui vous permet de :
- 🔍 **Détecter** les erreurs instantanément
- 📊 **Analyser** les performances
- 🚨 **Recevoir** des alertes
- 👥 **Collaborer** avec votre équipe

## 🚀 Installation et Configuration

### 1. Créer un compte Sentry
```bash
# Aller sur https://sentry.io
# Créer un compte gratuit
# Créer un projet "Profitum-Notifications"
```

### 2. Installer Sentry
```bash
npm install @sentry/node
```

### 3. Configurer les variables d'environnement
```bash
# Dans votre .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production
```

### 4. Récupérer votre DSN
1. Aller sur https://sentry.io
2. Sélectionner votre projet
3. Settings → Projects → [Votre Projet]
4. Copier le DSN

## 🎮 Comment utiliser Sentry

### **Interface Web Sentry**

```
┌─────────────────────────────────────┐
│ 🔴 SENTRY DASHBOARD                 │
├─────────────────────────────────────┤
│ 📊 Issues (Erreurs)                 │
│ 🚨 Alerts (Alertes)                 │
│ 📈 Performance                      │
│ 👥 Team (Équipe)                    │
│ ⚙️ Settings (Configuration)         │
└─────────────────────────────────────┘
```

### **Utilisation dans le code**

```typescript
// 1. Service de notifications avec Sentry
const notificationService = new NotificationServiceExtended();

// 2. Envoyer une notification avec traçage
await notificationService.sendNotificationWithTracing(
  'client-123',
  'client',
  NotificationType.CLIENT_DOCUMENT_UPLOADED,
  {
    document_name: 'facture.pdf',
    document_type: 'facture',
    upload_date: new Date().toISOString()
  },
  NotificationPriority.HIGH
);
```

### **3. Voir les erreurs dans Sentry**

1. **Aller sur** https://sentry.io
2. **Sélectionner** votre projet
3. **Voir** les erreurs en temps réel

## 📊 Fonctionnalités Sentry

### **🔍 Détection d'Erreurs**
- ✅ Erreurs automatiques
- ✅ Stack traces complets
- ✅ Contexte utilisateur
- ✅ Variables d'environnement

### **📈 Performance**
- ⏱️ Temps de réponse
- 🔄 Traçage des requêtes
- 📊 Métriques personnalisées

### **🚨 Alertes**
- 📧 Notifications email
- 💬 Intégration Slack
- 📱 Notifications push

### **👥 Collaboration**
- 🏷️ Assignation d'erreurs
- 💬 Commentaires
- 📋 Workflow d'équipe

## 🎯 Exemples d'Utilisation

### **Exemple 1 : Notification Client**
```typescript
// Envoyer une notification à un client
try {
  await notificationService.sendNotificationWithTracing(
    clientId,
    'client',
    NotificationType.CLIENT_DOCUMENT_VALIDATED,
    {
      document_name: 'contrat.pdf',
      validation_date: new Date().toISOString(),
      validator_name: 'Expert Jean Dupont'
    }
  );
} catch (error) {
  // L'erreur est automatiquement envoyée à Sentry
  console.error('Erreur notification client:', error);
}
```

### **Exemple 2 : Notification Expert**
```typescript
// Envoyer une notification à un expert
await notificationService.sendNotificationWithTracing(
  expertId,
  'expert',
  NotificationType.EXPERT_NEW_ASSIGNMENT,
  {
    client_name: 'Entreprise ABC',
    project_name: 'Audit énergétique',
    project_type: 'audit',
    estimated_budget: '5000€',
    deadline: '2024-02-15'
  },
  NotificationPriority.HIGH
);
```

### **Exemple 3 : Notification Admin**
```typescript
// Notifier tous les admins
const adminIds = await getAdminIds();
for (const adminId of adminIds) {
  await notificationService.sendNotificationWithTracing(
    adminId,
    'admin',
    NotificationType.ADMIN_WORKFLOW_ESCALATION,
    {
      client_name: 'Entreprise XYZ',
      expert_name: 'Expert Marie Martin',
      escalation_reason: 'Deadline dépassée',
      priority_level: 'URGENT'
    },
    NotificationPriority.URGENT
  );
}
```

## 📱 Dashboard Sentry

### **Page d'accueil**
- 📊 **Issues** : Erreurs en cours
- 📈 **Performance** : Temps de réponse
- 🚨 **Alerts** : Alertes actives
- 👥 **Team** : Activité équipe

### **Détail d'une erreur**
- 🔍 **Stack trace** : Ligne par ligne
- 📋 **Context** : Variables, utilisateur
- 📊 **Occurrences** : Fréquence
- 👥 **Assignation** : Responsable

### **Métriques**
- ⏱️ **Response Time** : Temps de réponse
- 📊 **Throughput** : Débit
- 🔄 **Error Rate** : Taux d'erreur
- 📈 **Trends** : Évolutions

## 🚨 Alertes et Notifications

### **Configuration d'alertes**
1. **Aller** dans Settings → Alerts
2. **Créer** une nouvelle alerte
3. **Configurer** les conditions
4. **Choisir** les canaux (Email, Slack)

### **Exemples d'alertes**
- 🚨 **Erreur critique** : > 5 erreurs/min
- ⚠️ **Performance** : Temps > 2s
- 📧 **Email échoué** : Taux > 10%
- 🔄 **SMS échoué** : Taux > 5%

## 🎯 Avantages pour Profitum

### **Pour les Développeurs**
- 🔍 **Debugging rapide** : Stack traces détaillés
- 📊 **Performance** : Optimisation continue
- 🚨 **Proactivité** : Détection avant les utilisateurs

### **Pour les Admins**
- 📈 **Monitoring** : Vue d'ensemble système
- 🚨 **Alertes** : Réaction immédiate
- 📊 **Métriques** : Prise de décision

### **Pour les Utilisateurs**
- 🛡️ **Fiabilité** : Moins d'erreurs
- ⚡ **Performance** : Réponses rapides
- 🔄 **Stabilité** : Service continu

## 🔧 Configuration Avancée

### **Environnements**
```typescript
// Development
SENTRY_DSN=https://dev-dsn@sentry.io/project-id
NODE_ENV=development

// Production
SENTRY_DSN=https://prod-dsn@sentry.io/project-id
NODE_ENV=production
```

### **Filtrage d'erreurs**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filtrer les erreurs non critiques
    if (event.level === 'info') {
      return null;
    }
    return event;
  }
});
```

## 📞 Support

- 📧 **Email** : support@sentry.io
- 📚 **Documentation** : https://docs.sentry.io
- 💬 **Chat** : Disponible sur le dashboard
- 🎥 **Vidéos** : Tutoriels YouTube

---

**🎉 Votre système de notifications est maintenant monitoré avec Sentry !** 