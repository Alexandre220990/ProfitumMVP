# 🎯 Configuration Sentry - Tags & Context

## 📋 **Highlighted Tags (Tags Mis en Évidence)**

### **Tags Recommandés :**
```
handled
level
url
user
service
environment
version
module
operation
userType
statusCode
method
path
component
action
errorType
```

### **Pourquoi ces tags :**

- **handled** : Erreurs gérées vs non gérées
- **level** : Niveau de gravité (error, warning, info)
- **url** : URL de la requête
- **user** : ID utilisateur
- **service** : Service concerné (profitum-server, profitum-client)
- **environment** : Environnement (production, development)
- **version** : Version de l'application
- **module** : Module concerné (clients, experts, admins, notifications)
- **operation** : Opération effectuée (create, update, delete, view)
- **userType** : Type d'utilisateur (client, expert, admin)
- **statusCode** : Code de statut HTTP
- **method** : Méthode HTTP (GET, POST, PUT, DELETE)
- **path** : Chemin de la route
- **component** : Composant React (pour le client)
- **action** : Action utilisateur (click, submit, navigate)
- **errorType** : Type d'erreur (validation, database, network)

---

## 🔍 **Highlighted Context (Contexte Mis en Évidence)**

### **Configuration JSON Recommandée :**

```json
{
  "user": [
    "id",
    "userType",
    "email",
    "name"
  ],
  "trace": [
    "trace_id",
    "span_id"
  ],
  "request": [
    "url",
    "method",
    "headers",
    "query",
    "body"
  ],
  "extra": [
    "userId",
    "clientId",
    "expertId",
    "adminId",
    "documentId",
    "projectId",
    "sessionId"
  ],
  "tags": [
    "service",
    "module",
    "operation",
    "environment",
    "version"
  ]
}
```

### **Explication des Contextes :**

#### **user** : Informations utilisateur
- **id** : Identifiant unique de l'utilisateur
- **userType** : Type (client, expert, admin)
- **email** : Email de l'utilisateur
- **name** : Nom de l'utilisateur

#### **trace** : Traçage des performances
- **trace_id** : Identifiant de la trace
- **span_id** : Identifiant du span

#### **request** : Détails de la requête
- **url** : URL complète
- **method** : Méthode HTTP
- **headers** : En-têtes de la requête
- **query** : Paramètres de requête
- **body** : Corps de la requête

#### **extra** : Données métier
- **userId** : ID utilisateur
- **clientId** : ID client
- **expertId** : ID expert
- **adminId** : ID admin
- **documentId** : ID document
- **projectId** : ID projet
- **sessionId** : ID session

#### **tags** : Tags personnalisés
- **service** : Service concerné
- **module** : Module concerné
- **operation** : Opération effectuée
- **environment** : Environnement
- **version** : Version

---

## 🎯 **Utilisation dans le Code**

### **1️⃣ Tags dans le Serveur**

```typescript
import * as Sentry from "@sentry/node";

// Définir des tags
Sentry.setTag('service', 'profitum-server');
Sentry.setTag('module', 'clients');
Sentry.setTag('operation', 'create');
Sentry.setTag('userType', 'admin');

// Capturer une erreur avec tags
Sentry.captureException(error, {
  tags: {
    handled: 'true',
    level: 'error',
    statusCode: '500',
    method: 'POST',
    path: '/api/clients'
  }
});
```

### **2️⃣ Context dans le Serveur**

```typescript
// Définir l'utilisateur
Sentry.setUser({
  id: userId,
  userType: userType,
  email: userEmail
});

// Ajouter du contexte extra
Sentry.setExtra('clientId', clientId);
Sentry.setExtra('documentId', documentId);
Sentry.setExtra('sessionId', sessionId);
```

### **3️⃣ Tags dans le Client**

```typescript
import * as Sentry from "@sentry/react";

// Définir des tags
Sentry.setTag('service', 'profitum-client');
Sentry.setTag('component', 'UserProfile');
Sentry.setTag('action', 'form_submit');

// Capturer une erreur avec tags
Sentry.captureException(error, {
  tags: {
    handled: 'false',
    level: 'error',
    component: 'UserProfile',
    action: 'form_submit'
  }
});
```

### **4️⃣ Context dans le Client**

```typescript
// Définir l'utilisateur
Sentry.setUser({
  id: userId,
  userType: userType,
  email: userEmail
});

// Ajouter du contexte extra
Sentry.setExtra('formData', formData);
Sentry.setExtra('currentPage', currentPage);
Sentry.setExtra('userAgent', navigator.userAgent);
```

---

## 📊 **Dashboard Configuration**

### **Filtres Recommandés :**

#### **Par Service :**
```
service:profitum-server
service:profitum-client
```

#### **Par Module :**
```
module:clients
module:experts
module:admins
module:notifications
```

#### **Par Type d'Utilisateur :**
```
userType:client
userType:expert
userType:admin
```

#### **Par Opération :**
```
operation:create
operation:update
operation:delete
operation:view
```

#### **Par Niveau :**
```
level:error
level:warning
level:info
```

---

## 🚨 **Alertes Basées sur les Tags**

### **1️⃣ Erreurs par Module**
```
Condition: Error rate > 5% for module:clients
Action: Email notification
```

### **2️⃣ Erreurs par Type d'Utilisateur**
```
Condition: Error rate > 10% for userType:admin
Action: Slack notification
```

### **3️⃣ Erreurs Non Gérées**
```
Condition: Error rate > 20% for handled:false
Action: Email + Slack notification
```

### **4️⃣ Erreurs de Performance**
```
Condition: Response time > 2s for operation:create
Action: Email notification
```

---

## 🔍 **Debugging Optimisé**

### **Workflow de Debugging :**

1. **Voir les tags mis en évidence** en haut de la page d'erreur
2. **Filtrer par module** pour isoler le problème
3. **Vérifier le contexte utilisateur** pour comprendre l'impact
4. **Analyser les traces** pour identifier le goulot d'étranglement
5. **Examiner les données extra** pour le contexte métier

### **Exemples de Debugging :**

#### **Erreur Client :**
```
Tags: service=profitum-client, component=UserProfile, action=form_submit
Context: user={id: "123", userType: "client"}, extra={formData: {...}}
```

#### **Erreur Serveur :**
```
Tags: service=profitum-server, module=clients, operation=create
Context: user={id: "456", userType: "admin"}, extra={clientId: "789"}
```

---

## 🎉 **Résultat Final**

Avec cette configuration, vous aurez :
- ✅ **Debugging rapide** (tags mis en évidence)
- ✅ **Contexte riche** (informations utilisateur et métier)
- ✅ **Filtrage précis** (par module, type, opération)
- ✅ **Alertes ciblées** (basées sur les tags)
- ✅ **Traçage complet** (performance et erreurs)

**Votre debugging Sentry est maintenant optimisé !** 🚀 