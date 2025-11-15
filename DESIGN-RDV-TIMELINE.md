## Design Timeline / Résumé / Tâches RDV

### 1. Objectifs
- Enregistrer chaque interaction liée à un dossier (RDV créés, complétés, relances, tâches) dans une timeline unifiée.
- Permettre aux participants d’un RDV de consigner un résumé après passage au statut `completed`.
- Créer des tâches/relances (suivi_dossier, échéance_admin, rappel_personnel) reliées aux mêmes entités (client, expert, apporteur, dossier).

### 2. Structures proposées

#### Table `RDV_Timeline`
| Colonne | Type | Détails |
| --- | --- | --- |
| id | UUID PK | `gen_random_uuid()` |
| rdv_id | UUID | FK `RDV(id)` |
| client_id | UUID | FK `Client(id)` |
| expert_id | UUID | FK `Expert(id)` nullable |
| apporteur_id | UUID | FK `ApporteurAffaires(id)` nullable |
| cabinet_id | UUID | FK `Cabinet(id)` nullable |
| client_produit_eligible_id | UUID | FK `ClientProduitEligible(id)` nullable |
| event_type | text | enum logique : `rdv_created`, `rdv_completed`, `task_created`, `deadline`, `note` |
| metadata | jsonb | snapshot des infos (participants, catégorie, titre) |
| created_at | timestamptz | défaut `now()` |

#### Table `RDV_Report`
| Colonne | Type | Détails |
| --- | --- | --- |
| id | UUID PK |  |
| rdv_id | UUID | FK `RDV(id)` ON DELETE CASCADE |
| author_id | UUID | `req.user.database_id` |
| author_type | text | `client`, `expert`, `apporteur`, `cabinet_responsable` |
| summary | text | contenu principal |
| action_items | jsonb | liste d’actions (titre, due_date, assigned_to) |
| visibility | text | `participants`, `cabinet`, `internal` |
| created_at | timestamptz | défaut `now()` |

#### Table `RDV_Task`
| Colonne | Type | Détails |
| --- | --- | --- |
| id | UUID PK |  |
| type | text | `suivi_dossier`, `echeance_admin`, `rappel_personnel` |
| title | text | obligatoire |
| description | text | optionnel |
| client_id | UUID | nullable selon type |
| expert_id | UUID | chargé de l’action |
| apporteur_id | UUID | créateur possible |
| cabinet_id | UUID | filtrage multi-experts |
| client_produit_eligible_id | UUID | requis pour `suivi_dossier` |
| due_date | date | obligatoire sauf `rappel_personnel` |
| status | text | `open`, `in_progress`, `done`, `cancelled` |
| priority | smallint | 1-4 |
| metadata | jsonb | pièces jointes, liens |
| created_by | UUID | utilisateur ayant créé la tâche |
| created_at / updated_at | timestamptz | triggers |

### 3. Flux applicatifs
1. **Création RDV** : après insertion, créer un enregistrement `RDV_Timeline` (`event_type = rdv_created`) avec `metadata` résumant `category`, participants, `cabinet_id`.
2. **Completion RDV** : lors du passage `status = completed`, ajouter `rdv_completed` et autoriser l’ajout de `RDV_Report`. Les résumés sont visibles dans la timeline.
3. **Tâches liées** : 
   - depuis un RDV (`category = suivi_dossier` ou `echeance_admin`), créer automatiquement une tâche associée (`RDV_Task`) si l’utilisateur coche “Créer suivi”.
   - Les tâches alimentent aussi `RDV_Timeline` (`event_type = task_created`).
4. **Notifications** : pour chaque ajout (RDV, tâche, résumé), envoyer une notification aux participants concernés ou membres cabinet selon `visibility`.

### 4. Endpoints REST à prévoir
| Endpoint | Description |
| --- | --- |
| `GET /api/rdv/:id/timeline` | retourne les entrées `RDV_Timeline` + `RDV_Report` liées. |
| `POST /api/rdv/:id/report` | crée un résumé ; validations (participant, statut `completed`). |
| `POST /api/rdv/:id/tasks` | crée une tâche liée au RDV/dossier. |
| `PATCH /api/tasks/:id` | met à jour statut, due_date, assignee. |
| `GET /api/dossiers/:id/timeline` | agrège timeline RDV + tâches + documents pour la fiche dossier. |

### 5. Scripts SQL planifiés
1. `create-rdv-timeline-step20.sql` : table `RDV_Timeline` + index (client_id, cabinet_id).
2. `create-rdv-report-step21.sql` : table `RDV_Report`, triggers `updated_at`.
3. `create-rdv-task-step22.sql` : table `RDV_Task`, contraintes spécifiques par type (check). 
4. `seed-rdv-timeline-backfill-step23.sql` : backfill depuis `RDV` existants.

Chaque script comprendra les contrôles `information_schema` + requêtes de validation.

