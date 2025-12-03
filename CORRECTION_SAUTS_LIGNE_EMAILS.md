# Correction : Respect des sauts de ligne dans les emails de prospection

## 📋 Problème identifié

Les sauts de ligne saisis dans l'éditeur d'emails de prospection n'étaient **pas respectés** lors de l'envoi réel des emails.

### Cause technique

1. **Frontend** : L'éditeur utilise un `<Textarea>` qui stocke les sauts de ligne comme caractères `\n`
2. **Backend** : Le corps de l'email était envoyé directement en HTML sans conversion : `html: input.body`
3. **Résultat** : En HTML, les caractères `\n` ne créent **pas** de sauts de ligne visuels

## ✅ Solution implémentée

### 1. Backend - Conversion automatique des sauts de ligne

**Fichier modifié** : `server/src/services/ProspectEmailService.ts`

#### Fonction ajoutée : `convertLineBreaksToHTML()`

```typescript
/**
 * Convertir les sauts de ligne en HTML
 * Préserve les balises HTML existantes et convertit uniquement les \n en <br>
 */
private static convertLineBreaksToHTML(text: string): string {
  // Détecte si le texte contient déjà du HTML significatif
  const hasHTMLTags = /<(p|div|br|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th)[>\s]/i.test(text);
  
  if (hasHTMLTags) {
    // Déjà du HTML, ne pas modifier
    return text;
  }
  
  // Texte brut : convertir en HTML
  // - Double saut de ligne (\n\n) → Nouveau paragraphe <p>
  // - Simple saut de ligne (\n) → Balise <br>
  const paragraphs = text
    .split(/\n\s*\n/)  // Séparer par double saut de ligne
    .map(para => {
      const withBreaks = para
        .trim()
        .replace(/\n/g, '<br>');
      return withBreaks ? `<p style="margin: 0 0 1em 0;">${withBreaks}</p>` : '';
    })
    .filter(p => p)
    .join('');
  
  return paragraphs || text;
}
```

#### Application lors de l'envoi

```typescript
// Avant l'envoi SMTP
const htmlBody = this.convertLineBreaksToHTML(input.body);

const mailOptions: any = {
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
  to: prospect.email,
  subject: input.subject,
  html: htmlBody,  // ✅ Version HTML avec sauts de ligne convertis
  text: textVersion
};
```

### 2. Frontend - Message informatif

**Fichier modifié** : `client/src/pages/admin/prospection.tsx`

Ajout d'un message sous l'éditeur de corps d'email :

```tsx
<Textarea
  value={step.body}
  onChange={(e) => updateStep(prospect.id, step.id, 'body', e.target.value)}
  placeholder="Corps de l'email"
  className="mt-1 min-h-[150px]"
/>
<p className="text-xs text-gray-500 mt-1">
  💡 Les sauts de ligne sont automatiquement préservés dans l'email envoyé
</p>
```

## 🎯 Comportement après correction

### Exemple de template saisi

```
Bonjour {firstname},

J'espère que vous allez bien.

Nous avons une solution pour vous.

Cordialement,
Alexandre
```

### Email HTML envoyé

```html
<p style="margin: 0 0 1em 0;">Bonjour {firstname},<br>J'espère que vous allez bien.</p>
<p style="margin: 0 0 1em 0;">Nous avons une solution pour vous.</p>
<p style="margin: 0 0 1em 0;">Cordialement,<br>Alexandre</p>
```

### Rendu visuel pour le destinataire

```
Bonjour {firstname},
J'espère que vous allez bien.

Nous avons une solution pour vous.

Cordialement,
Alexandre
```

## ✨ Avantages de cette solution

1. ✅ **Transparent pour l'utilisateur** : aucun changement de workflow
2. ✅ **Préserve le format original** : les templates restent éditables facilement (stockés avec `\n` en base)
3. ✅ **Compatible HTML existant** : détecte automatiquement si le contenu est déjà en HTML
4. ✅ **Conversion intelligente** :
   - Double saut de ligne → Nouveau paragraphe
   - Simple saut de ligne → Balise `<br>`
5. ✅ **Pas de régression** : les anciens emails ne sont pas affectés

## 🔍 Points techniques importants

### Stockage en base de données

Le `body` reste stocké **tel quel** avec les caractères `\n` :
- ✅ Facilite la réédition
- ✅ Évite les problèmes d'échappement HTML
- ✅ Compatibilité avec les anciens emails

### Conversion uniquement à l'envoi

La fonction `convertLineBreaksToHTML()` est appelée **uniquement** lors de l'envoi SMTP :
- Ligne 124-125 dans `ProspectEmailService.ts`
- Avant la construction des `mailOptions`

### Détection intelligente

La fonction détecte si le contenu est déjà du HTML :
```typescript
const hasHTMLTags = /<(p|div|br|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|td|th)[>\s]/i.test(text);
```

Si des balises HTML sont présentes, **aucune conversion** n'est effectuée.

## 📊 Zones d'application

Cette correction s'applique à :

1. ✅ Envoi d'emails individuels (`POST /api/prospects/:id/send-email`)
2. ✅ Envoi d'emails en bulk (`POST /api/prospects/send-bulk`)
3. ✅ Envoi d'emails programmés (`POST /api/prospects/send-scheduled`)
4. ✅ Emails générés par IA (déjà avec `\n` → conversion automatique)

## 🧪 Tests recommandés

### Test 1 : Email simple avec sauts de ligne

**Template** :
```
Bonjour,

Première ligne.
Deuxième ligne.

Cordialement
```

**Vérification** : Les sauts de ligne sont visibles dans l'email reçu.

### Test 2 : Email généré par IA

**Action** : Générer une séquence avec l'IA (V1 ou V2)

**Vérification** : Les sauts de ligne générés par l'IA sont préservés.

### Test 3 : Email avec HTML existant

**Template** :
```html
<p>Paragraphe 1</p>
<p>Paragraphe 2</p>
```

**Vérification** : Le HTML n'est pas modifié.

## 📝 Notes de développement

- Aucune migration de base de données nécessaire
- Les anciens emails stockés avec `\n` fonctionneront automatiquement
- Compatible avec les futures évolutions (éditeur WYSIWYG, etc.)

## ⚠️ Points d'attention

### Si un éditeur HTML riche est ajouté plus tard

La fonction `convertLineBreaksToHTML()` détecte automatiquement le HTML :
- Si l'éditeur génère du HTML → pas de conversion
- Si c'est du texte brut → conversion automatique

### Génération IA

Les prompts IA génèrent déjà des emails avec `\n` :
```typescript
body: generatedStep.body?.replace(/\\n/g, '\n')
```

La conversion HTML se fera automatiquement lors de l'envoi.

## 🎉 Résultat

Les emails de prospection **respectent désormais exactement** les sauts de ligne saisis dans l'éditeur, offrant une expérience utilisateur cohérente et professionnelle.

---

**Date de correction** : 3 décembre 2025  
**Fichiers modifiés** :
- `server/src/services/ProspectEmailService.ts`
- `client/src/pages/admin/prospection.tsx`

