# 🔒 Configuration Sécurité Sentry

## 🎯 **Security Token Header**

### **Configuration dans Sentry Dashboard :**

#### **Token Header :**
```
X-Sentry-Token
```

#### **Token Value :**
```
your-sentry-token-here
```

### **Comment ça fonctionne :**

1. **Sécurité par domaine** : Seuls les domaines autorisés peuvent utiliser ce token
2. **Headers automatiques** : Sentry ajoute automatiquement le header à toutes les requêtes
3. **Validation côté serveur** : Sentry vérifie le token pour chaque requête

---

## 🌐 **Allowed Domains Configuration**

### **Domaines recommandés :**

```
https://your-domain.com
https://*.your-domain.com
https://localhost:5001
https://localhost:3000
http://localhost:5001
http://localhost:3000
```

### **Pourquoi ces domaines :**

- **profitum.fr** : Domaine de production principal
- ***.profitum.fr** : Sous-domaines (api.profitum.fr, admin.profitum.fr, etc.)
- **localhost:5001** : Serveur backend en développement
- **localhost:3000** : Frontend en développement

---

## 🔧 **Configuration dans votre code**

### **1️⃣ Variables d'environnement (.env)**

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TOKEN=your-sentry-token-here
SENTRY_TOKEN_HEADER=X-Sentry-Token
NODE_ENV=development
APP_VERSION=1.0.0
```

### **2️⃣ Configuration Sentry (instrument.ts)**

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Configuration de sécurité
  sendDefaultPii: true,
  
  // Traces sample rate
  tracesSampleRate: 1.0,
  
  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Filtrage des erreurs
  beforeSend(event) {
    // Ignorer les erreurs 404
    if (event.tags?.statusCode === '404') {
      return null;
    }
    
    // Ignorer les erreurs de développement
    if (process.env.NODE_ENV === 'development' && event.level === 'info') {
      return null;
    }
    
    // Ajouter des tags globaux
    event.tags = {
      ...event.tags,
      service: 'profitum-server',
      version: process.env.APP_VERSION || '1.0.0',
    };
    
    return event;
  },
});
```

---

## 🛡️ **Sécurité Avancée**

### **1️⃣ Vérification TLS/SSL**
✅ **Activer** - Pour sécuriser toutes les communications

### **2️⃣ JavaScript Source Fetching**
✅ **Activer** - Pour avoir le contexte complet des erreurs

### **3️⃣ Spike Protection**
✅ **Activer** - Pour éviter le spam d'erreurs

---

## 🔍 **Test de la Configuration**

### **1️⃣ Test de sécurité**

```bash
# Tester avec curl
curl -H "X-Sentry-Token: your-sentry-token-here" \
     -H "Origin: https://your-domain.com" \
     http://localhost:5001/debug-sentry
```

### **2️⃣ Test de domaine non autorisé**

```bash
# Ceci devrait être rejeté
curl -H "X-Sentry-Token: your-sentry-token-here" \
     -H "Origin: https://malicious-site.com" \
     http://localhost:5001/debug-sentry
```

---

## 🚨 **Alertes de Sécurité**

### **Configuration d'alertes recommandées :**

#### **1. Tentative d'accès non autorisé**
```
Condition: Request from unauthorized domain
Action: Email + Slack notification
```

#### **2. Token invalide**
```
Condition: Invalid security token
Action: Email notification
```

#### **3. Spike d'erreurs**
```
Condition: Error rate spike > 10x normal
Action: Email + Slack notification
```

---

## 📊 **Monitoring de Sécurité**

### **Métriques à surveiller :**

1. **Requêtes rejetées** : Tentatives d'accès non autorisées
2. **Tokens invalides** : Tentatives avec mauvais token
3. **Domaines bloqués** : Tentatives depuis des domaines non autorisés
4. **Rate limiting** : Protection contre les attaques par déni de service

---

## 🔄 **Maintenance de Sécurité**

### **Actions mensuelles :**

1. **Réviser les domaines autorisés**
2. **Vérifier les logs de sécurité**
3. **Mettre à jour les tokens si nécessaire**
4. **Analyser les tentatives d'accès non autorisées**

---

## 🎉 **Résultat Final**

Avec cette configuration de sécurité, vous avez :

- ✅ **Protection par domaine** : Seuls vos domaines autorisés
- ✅ **Token de sécurité** : Authentification des requêtes
- ✅ **TLS/SSL** : Communications chiffrées
- ✅ **Spike protection** : Protection contre les attaques
- ✅ **Monitoring complet** : Surveillance des tentatives d'accès

**Votre projet Profitum est maintenant sécurisé !** 🛡️ 