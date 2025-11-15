## Design UI Admin — Cabinets & Partenaires

### 1. Pages principales
- `admin/cabinets/index.tsx`
  - Tableau filtrable (nom, SIRET, responsable) + cartes KPI en header (nombre de cabinets actifs, clients suivis, fees mensuels).
  - Actions rapides sur chaque ligne : `Consulter`, `Éditer`, `Voir fiche expert principale`.
  - Bouton `Nouveau cabinet` ouvrant un modal (nom, SIRET, contacts) → appelle `POST /api/admin/cabinets`.

- `admin/cabinets/[id].tsx`
  - Header : informations clés (logo, nom, SIRET, contact, stats).
  - Onglets :
    1. `Synthèse` : composants KPI (clients actifs, dossiers en cours, fees par produit, RDV 30j, tâches ouvertes). Graphiques simples (barres/ligne) selon `CabinetProduitEligible`.
    2. `Équipe` : table `CabinetMember` (nom, rôle, email, produits autorisés, date d’ajout). Boutons `Inviter membre` (modale) et `Retirer`.
    3. `Produits` : table `CabinetProduitEligible` (produit, commission, fee, statut). Édition inline → `PUT /api/admin/cabinets/:id/products`.
    4. `Clients / Dossiers` : usage des endpoints existants (`Client`, `ClientProduitEligible`) filtrés par `cabinet_id`. Ajout bouton `Partager dossier` (appelle `/api/admin/dossiers/:cpeId/share`).
    5. `Apporteurs` : tableau des `ApporteurAffaires` rattachés + métriques (clients, dossiers). Action `Définir cabinets autorisés`.

- `admin/experts/[id].tsx`
  - Section `Cabinet actuel` + switch si multi-cabinets.
  - KPI personnels (RDV à venir, dossiers actifs, tâches ouvertes, satisfaction client si disponible).
  - Listes : `Produits autorisés`, `Clients`, `Tâches`, `Timeline` (RDV_Timeline filtrée par expert).

### 2. Composants réutilisables
- `CabinetKpiCards` : 4 cartes (clients, dossiers, fees, RDV).
- `MembersTable` : table avec tags rôles, boutons action.
- `ProductsGrid` : grille responsive pour éditer commission/fee.
- `ShareDossierModal` : champ auto-complete expert/cabinet + permission.
- `CabinetActivityTimeline` : affichage mixte RDV + tâches + résumés.

### 3. Intégration API
- Axios/fetch wrappers dans `client/src/services/admin-cabinet-service.ts` :
  - `getCabinets`, `createCabinet`, `updateCabinet`, `updateCabinetProducts`, `addMember`, `removeMember`, `getCabinetDetail`.
- Hook React Query (ou SWR) pour gérer cache/chargement, invalidation sur mutation.

### 4. Navigation & autorisation
- Route guard pour `/admin/*` : vérifier `user.type === 'admin'`.
- Ajouter onglet “Cabinets” dans le sidebar admin existant.

### 5. Style & UX
- Respect du design minimal, tons sobres, beaucoup d’espace blanc.
- Utiliser composants existants (`DataTable`, `Card`, `Badge`, `Dialog`) ou ShadCN si présent.
- Fournir indicateurs clairs (badges `Actif / Inactif`, état des produits, contributions apporteurs).

### 6. Roadmap front
1. Créer service API + hooks (lectures/mutations).
2. Implémenter `admin/cabinets/index.tsx`.
3. Implémenter `admin/cabinets/[id].tsx` (onglets progressive enhancement).
4. Implémenter `admin/experts/[id].tsx` (utilisant déjà les données existantes + nouvelles tables).

