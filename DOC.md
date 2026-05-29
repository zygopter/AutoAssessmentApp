# Auto-Evaluation App — Documentation produit

Application web qui permet à des **professeurs** de construire des
formulaires d'auto-évaluation par compétences, et à leurs **élèves** de
s'auto-positionner sur ces compétences depuis un compte personnel.

L'application est aujourd'hui une SPA React qui s'adresse directement à
**Supabase** (Auth + Postgres + RPC + Row Level Security). L'ancien
backend Express/Sequelize a été retiré : tout le code métier vit
maintenant dans la base, via des politiques RLS et quelques fonctions
SQL (`create_class`, `join_class`, `search_students_in_class`, etc.).

---

## 1. Vue produit

### 1.1 Acteurs

| Rôle        | Stockage                         | Ce qu'il peut faire                                                                 |
| ----------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| **Professeur** (`role = 'teacher'`) | `profiles.role = 'teacher'` | Gère ses classes, le référentiel de compétences, ses formulaires, envoie les formulaires |
| **Élève** (`role = 'student'`)      | `profiles.role = 'student'` | Rejoint une classe via un code, remplit les formulaires envoyés par son prof        |

Le rôle est choisi à l'inscription (`RegisterPage.js`) et stocké dans la
table `profiles` via le trigger SQL `handle_new_user`. Le frontend lit
ce rôle pour rediriger sur `/teacher` ou `/student` après login.

### 1.2 Authentification

- Inscription / connexion par **email + mot de passe** (Supabase Auth).
- À l'inscription, `name` et `role` sont passés dans
  `options.data` de `supabase.auth.signUp`, puis recopiés dans
  `profiles` par le trigger `on_auth_user_created`.
- La session Supabase est persistée dans `localStorage` par le SDK ;
  l'`AuthContext` la "rehydrate" au démarrage et écoute
  `onAuthStateChange` pour rester synchronisé.
- À la déconnexion (`logout`), `supabase.auth.signOut()` est appelé et
  l'utilisateur est renvoyé vers `/login`.

### 1.3 Échelle de notation

Toute évaluation se fait sur **4 niveaux** :

| Code | Libellé       |
| ---- | ------------- |
| A    | Maîtrisé      |
| B    | Satisfaisant  |
| C    | Commencé      |
| D    | Insuffisant   |

C'est l'échelle proposée dans `FormPreview.js` (prévisualisation) et
`StudentFormFill.js` (remplissage par l'élève).

---

## 2. Fonctionnalités côté Professeur

L'espace prof (`/teacher`, composant `TeacherPage.js`) est organisé en
**3 onglets** côte à côte.

### 2.1 Onglet Classes (`/teacher/classes`)

Fichier principal : `components/ClassesTab.js` +
`components/ClassDetail.js`.

- **Créer une classe** : il suffit de saisir un nom. L'année
  académique est calculée automatiquement à partir de la date du jour
  (`2025-2026` à partir du mois d'août, sinon `2024-2025`). Un **code
  d'inscription de 6 caractères** est généré côté SQL par la fonction
  `generate_class_code` (RPC `create_class`).
- **Lister ses classes** : la requête `fetchClasses` embarque
  `students(count)` pour afficher l'effectif. La RLS filtre
  automatiquement : un prof ne voit que les classes dont il est
  `teacher_id`, un élève ne voit que les classes auxquelles il
  appartient.
- **Détail d'une classe** (`/teacher/classes/:classId`) :
  - **Ajouter un élève à l'unité** (prénom + nom).
  - **Importer une liste** d'élèves au format `Nom, Prénom` (un par
    ligne) via `ImportStudents.js`.
  - **Tableau d'évaluations** : croise les élèves de la classe avec
    toutes les compétences regroupées par catégorie ; chaque case
    affiche la note de l'élève (placeholder `-` tant que la
    submission n'est pas exploitée pour remplir le tableau).
  - **Régénérer le code d'inscription** via la RPC
    `regenerate_class_code` (utile si le code a fuité).
  - **Envoyer un formulaire à la classe** : sélectionne un formulaire
    existant et insère une ligne dans `form_assignments`. Tous les
    élèves de la classe le verront en "en attente".
- **Supprimer une classe** : la RLS limite l'action au prof
  propriétaire, et la suppression en cascade nettoie les élèves liés.

### 2.2 Onglet Compétences (`/teacher/competences`)

Fichier principal : `components/CompetencesTab.js`.

Le référentiel est partagé en lecture entre tous les profs (`anyone
reads categories/competences` dans la migration) mais chacun n'écrit que
sur ce qu'il a créé.

- **Catégories** (ex. "RÉALISER", "ANALYSER")
  - Nom + description.
  - CRUD complet ; **une catégorie ne peut pas être supprimée** tant
    qu'elle contient au moins une compétence (vérification côté
    client dans `deleteCategory` en plus de la RLS).
- **Compétences** rangées dans une catégorie
  - Nom, description, et une liste de **points de contrôle**
    (sous-critères) saisis librement et stockés dans `control_points`
    (colonne JSONB).
  - CRUD complet ; l'éditeur permet d'ajouter dynamiquement des
    points de contrôle.

L'écran utilise un `Accordion` Radix : chaque catégorie est repliable
et révèle ses compétences au déploiement.

### 2.3 Onglet Formulaires (`/teacher/formulaires`)

Fichier principal : `components/FormsTab.js` + prévisualisation
`components/FormPreview.js`.

- **Créer un formulaire** : titre + sélection de compétences via des
  cases à cocher, regroupées par catégorie pour faciliter le pickage
  transverse. Les IDs cochés sont stockés dans la colonne JSONB
  `formulaires.competences`.
- **Prévisualiser** (`/formulaires/preview/:formId`) : affiche le rendu
  élève (libellé + description + radio A/B/C/D) sans persister la
  réponse — utile pour vérifier que le formulaire est cohérent avant
  envoi.
- **Copier le lien** de prévisualisation dans le presse-papier.
- **Supprimer** un formulaire (uniquement ceux qu'on a créés).

> ⚠️ La RLS `creator reads formulaires` limite la liste à ses propres
> formulaires (`created_by = auth.uid()`), donc deux profs ne voient pas
> les formulaires l'un de l'autre.

---

## 3. Fonctionnalités côté Élève

L'espace élève (`/student`, composant `StudentPage.js`, et le tableau
de bord `StudentDashboard.js`) est volontairement minimaliste :

### 3.1 Rejoindre une classe

Flux en 3 étapes pour éviter les erreurs de saisie :

1. L'élève entre le **code à 6 caractères** de la classe (donné par le
   prof) **+ au moins 3 lettres** de son nom de famille.
2. La RPC `search_students_in_class` retourne les fiches élèves
   pré-créées par le prof qui matchent, et qui ne sont **pas encore
   liées** à un compte (`user_id is null`).
3. L'élève sélectionne sa fiche dans la liste, et la RPC `join_class`
   pose `students.user_id = auth.uid()` sur la bonne ligne.

Cette mécanique permet au prof d'importer une liste d'élèves à
l'avance, sans connaître leur email, et de laisser chacun se "réclamer"
sa fiche au moment de s'inscrire.

### 3.2 Voir mes classes

Liste des classes rejointes (la même requête `fetchClasses` que côté
prof, mais la RLS `student reads joined classes` filtre via la fonction
`is_student_in_class`).

### 3.3 Remplir un formulaire en attente

- `getPendingFormsForStudent` croise côté client :
  - les fiches `students` de l'utilisateur,
  - les `form_assignments` des classes correspondantes,
  - les `submissions` déjà déposées,
    pour ne garder que les formulaires **assignés à ma classe** mais
    **pas encore soumis**.
- Click → `/student/form/:formId` ouvre `StudentFormFill.js`, qui
  affiche chaque compétence avec le sélecteur A/B/C/D.
- À la validation, `submitStudentForm` insère une ligne dans
  `submissions` (`responses` est un JSONB clé/valeur
  `{competenceId: 'A'|'B'|'C'|'D'}`).
- L'utilisateur est renvoyé vers `/confirmation` (page générique de
  remerciement).

> ⚠️ Le tableau d'évaluations côté prof (`ClassDetail.js`) lit pour
> l'instant `student.evaluations[compId]` qui n'est pas (encore)
> dérivé des `submissions`. La table existe et reçoit les réponses,
> mais l'agrégat pour le tableau prof reste à brancher.

---

## 4. Architecture technique

### 4.1 Vue d'ensemble

```
┌─────────────────────┐   HTTPS / JS SDK   ┌───────────────────────────┐
│  React SPA (CRA)    │ ────────────────▶  │  Supabase                 │
│  port 3000          │   JWT (Auth)       │  - Auth                    │
│                     │                    │  - Postgres + RLS          │
│                     │                    │  - RPC (Postgres functions)│
└─────────────────────┘                    └───────────────────────────┘
```

Plus aucun backend Node ; le client appelle directement Supabase via
`@supabase/supabase-js`. Les règles métier sensibles (création de
classe, génération du code, rattachement élève↔compte) sont des
fonctions Postgres `security definer` exposées en RPC.

### 4.2 Frontend — `auto-evaluation-app/`

- **React 18** bootstrappé avec **Create React App**.
- **React Router v6** ; redirections rôle-dépendantes dans `App.js`.
- **State / data layer** :
  - `AuthContext` — hydrate l'utilisateur depuis la session Supabase,
    expose `login` / `register` / `logout`. Si la session existe mais
    qu'aucun `profiles` ne correspond, la session est nettoyée
    (cas d'un user supprimé qui aurait laissé un token traînant).
  - `CompetencesContext` — charge en parallèle catégories,
    compétences (par catégorie), classes et formulaires dès qu'un
    utilisateur est connecté ; expose des CRUD wrappers et garde le
    state local synchronisé.
- **Accès données** : `services/api.js` est une fine couche de
  mapping snake_case ↔ camelCase autour du SDK Supabase. Elle expose
  des fonctions par entité (categories, competences, formulaires,
  classes, students, form_assignments, submissions) et délègue les
  opérations spéciales aux RPC (`create_class`, `regenerate_class_code`,
  `search_students_in_class`, `join_class`).
- **Client Supabase** : `services/supabaseClient.js` lit
  `REACT_APP_SUPABASE_URL` et `REACT_APP_SUPABASE_ANON_KEY` depuis
  l'environnement.
- **UI** : TailwindCSS + primitives Radix (Accordion, Checkbox,
  Dropdown, Radio, Select, Tabs), assemblées façon shadcn dans
  `components/ui/`. Icônes `lucide-react`, toasts `react-hot-toast`,
  copier-coller `react-copy-to-clipboard`.

### 4.3 Backend — Supabase

Tout est défini dans `supabase/migrations/` :

- `0001_init.sql` — schéma + RLS + RPC initiales.
- `0002_fix_rls_recursion.sql` — casse les cycles RLS
  (classes ↔ students, formulaires ↔ form_assignments) en passant par
  des fonctions `security definer` (`is_class_teacher`,
  `is_student_in_class`, `is_form_creator`).

### 4.4 Code legacy

Le dossier `auto-evaluation-back/` (Express + Sequelize) **n'est plus
utilisé** par le frontend mais reste présent dans le dépôt. Les
`docker-compose*.yml` à la racine font encore référence à une stack
backend + Postgres locale ; ils datent d'avant la migration Supabase et
ne reflètent plus le mode d'exécution recommandé.

---

## 5. Modèle de données (Postgres)

```
profiles (id ← auth.users)
  ├── name
  ├── role        (enum 'teacher' | 'student')
  └── created_at

classes
  ├── name, year, code (unique)
  └── teacher_id → profiles

students
  ├── first_name, last_name
  ├── class_id → classes
  └── user_id  → profiles (NULL tant que l'élève n'a pas rejoint)

categories
  ├── name, description
  └── created_by → profiles

competences
  ├── name, description
  ├── control_points (jsonb[])
  ├── category_id → categories
  └── created_by  → profiles

formulaires
  ├── title
  ├── competences (jsonb : tableau d'UUIDs de compétences)
  └── created_by  → profiles

form_assignments              -- "Le prof envoie le formulaire X à la classe Y"
  ├── form_id  → formulaires
  ├── class_id → classes
  └── unique (form_id, class_id)

submissions                   -- "L'élève Y a rempli le formulaire envoyé Z"
  ├── form_assignment_id → form_assignments
  ├── student_id         → students
  ├── responses (jsonb : { competenceId: 'A'|'B'|'C'|'D' })
  └── unique (form_assignment_id, student_id)
```

Choix notables :

- **UUID partout** (`gen_random_uuid()` via `pgcrypto`), aligné sur
  `auth.users`.
- **JSONB pour les listes ordonnées détenues par une ligne parente** :
  `control_points` (Competence) et `competences` (Formulaire) évitent
  des tables de liaison pour ce qui est conceptuellement un tableau
  trié appartenant à un seul propriétaire.
- **Cascade delete** systématique pour qu'une suppression de prof ou de
  classe nettoie proprement ce qui dépend.

---

## 6. Sécurité — Row Level Security

La RLS Postgres est l'épine dorsale de l'autorisation. Quelques
politiques clés :

- `classes` : un prof lit/édite/supprime celles dont il est
  `teacher_id` ; un élève ne peut lire que les classes auxquelles il
  appartient (via `is_student_in_class(id)`).
- `students` : un prof ne lit/édite que les élèves de **ses** classes
  (`is_class_teacher(class_id)`) ; un élève ne lit que sa propre fiche
  (`user_id = auth.uid()`).
- `categories` / `competences` : lecture **partagée** à tout
  utilisateur authentifié (le référentiel est un bien commun) ;
  écriture réservée au créateur, et la création exige `is_teacher()`.
- `formulaires` : un prof ne lit que ses propres formulaires ; un élève
  ne lit un formulaire que s'il existe une `form_assignment` sur une
  classe à laquelle il appartient.
- `submissions` : un élève peut insérer / lire / mettre à jour ses
  propres soumissions ; un prof lit toutes les soumissions liées à ses
  formulaires.

Les opérations qui n'ont **pas** vocation à passer par du CRUD direct
sont exposées en **RPC** `security definer` pour pouvoir court-circuiter
la RLS de manière contrôlée :

- `create_class(p_name, p_year)` — n'autorise la création que si
  `is_teacher()` est vrai, génère un code unique.
- `regenerate_class_code(p_class_id)` — vérifie que l'appelant est le
  prof propriétaire avant de regénérer.
- `search_students_in_class(p_class_code, p_last_name_prefix)` —
  expose une recherche par préfixe **≥ 3 caractères** sur les élèves
  d'une classe par son code, sans révéler la table complète.
- `join_class(p_class_code, p_first_name, p_last_name)` — lie le
  compte courant à une fiche élève préchargée qui correspond aux
  nom/prénom passés et qui n'est pas déjà réclamée.

---

## 7. Organisation du code

```
.
├── auto-evaluation-app/             # Frontend React (CRA)
│   ├── public/
│   └── src/
│       ├── App.js                   # Router + redirections par rôle
│       ├── index.js                 # AuthProvider + ReactDOM
│       ├── contexts/
│       │   ├── AuthContext.js       # Session Supabase → user app
│       │   └── CompetencesContext.js
│       ├── services/
│       │   ├── supabaseClient.js    # createClient(URL, ANON_KEY)
│       │   ├── api.js               # Mappers + CRUD + RPC
│       │   └── mockapi.js           # (reliquat, non utilisé)
│       ├── pages/                   # Pages routées (TeacherPage, …)
│       └── components/
│           ├── ui/                  # Primitives shadcn / Radix
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── ClassesTab.js
│           ├── ClassDetail.js
│           ├── CompetencesTab.js
│           ├── FormsTab.js
│           ├── FormPreview.js
│           ├── ImportStudents.js
│           ├── StudentPage.js
│           ├── StudentDashboard.js
│           ├── StudentFormFill.js
│           ├── ConfirmationPage.js
│           ├── TopBar.js
│           └── ErrorBoundary.js
│
├── supabase/
│   ├── config.toml                  # config CLI Supabase
│   └── migrations/
│       ├── 0001_init.sql            # Schéma + RLS + RPC
│       └── 0002_fix_rls_recursion.sql
│
└── auto-evaluation-back/            # Backend Express historique (legacy)
```

---

## 8. Démarrage local

1. **Créer un projet Supabase** (ou pointer vers une instance locale via
   la CLI Supabase) et y appliquer les deux migrations dans l'ordre :
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_fix_rls_recursion.sql`
2. Récupérer `URL` et `anon key` du projet, puis dans
   `auto-evaluation-app/.env` :
   ```
   REACT_APP_SUPABASE_URL=https://<project>.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<anon key>
   ```
3. Installer et lancer le frontend :
   ```bash
   cd auto-evaluation-app
   npm install
   npm start
   ```
4. Ouvrir `http://localhost:3000`, créer un compte **professeur**, puis
   un second compte **élève** pour tester le flux complet (créer une
   classe → ajouter une fiche élève → récupérer le code → s'inscrire en
   tant qu'élève → rejoindre la classe → envoyer un formulaire → le
   remplir).

---

## 9. Zones grises connues

- `updateStudentEvaluation` est volontairement non implémentée — la
  fonction lève une erreur explicite. Toute notation passe désormais
  par les `submissions`, et l'override direct d'une note par le prof
  n'est pas encore exposé.
- Le tableau "Évaluations des élèves" dans `ClassDetail.js` affiche
  encore `-` parce qu'aucune agrégation des `submissions` n'alimente
  un champ `student.evaluations`. La donnée est en base, le rendu prof
  reste à brancher.
- `ClassDetail.js` mélange usage d'UUID et `parseInt` hérité de
  l'ancienne base SQLite/Postgres en ID numériques (`Number(classId)`,
  `parseInt(classId)`) — fonctionnel parce que React Router renvoie une
  string, mais à nettoyer.
- Les fichiers `docker-compose*.yml` à la racine décrivent encore un
  Postgres + backend Express et ne servent plus le déploiement réel ;
  ils peuvent prêter à confusion tant qu'ils n'ont pas été mis à jour.
