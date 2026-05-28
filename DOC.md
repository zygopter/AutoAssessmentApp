# Auto-Evaluation App — Project Documentation

A web app that lets teachers build competence-based evaluation forms and
students self-assess against them.

---

## 1. Functional Specs

### Actors

- **Teacher** (`role: 'teacher'`) — manages classes, the competence library,
  and evaluation forms.
- **Student** (`role: 'student'`) — joins a class with a code and fills
  forms assigned by their teacher.

### Authentication

- Register / login via email + password.
- Account role (`teacher` or `student`) is chosen at registration.
- Session held by a JWT (24 h expiry) stored in `localStorage`; the
  frontend re-validates expiry every 30 s and forces re-login on expiry.
- After login the user is redirected to `/teacher` or `/student`
  depending on their role.

### Teacher features

Teacher area (`/teacher`) is organised in three tabs:

1. **Classes** (`/teacher/classes`)
   - Create a class (name + academic year). A unique 6-char join code is
     auto-generated.
   - List own classes with student counts.
   - Open a class detail view (`/teacher/classes/:classId`) to:
     - Add students one by one or via bulk import.
     - View / regenerate the join code (shareable with students).
     - Send a form to all students of the class.
     - View students' evaluation results per competence.
   - Delete a class (owner-only).

2. **Compétences** (`/teacher/competences`)
   - Manage a shared library of **categories** (e.g. "REALISER") and
     **competences** belonging to a category.
   - Each competence has a name, description, and a list of
     *control points* (sub-criteria, stored as JSON).
   - Full CRUD on both categories and competences.
   - A category cannot be deleted while it still contains competences.

3. **Formulaires** (`/teacher/formulaires`)
   - Create an evaluation form: title + a selection of competences picked
     across categories.
   - Preview a form (`/formulaires/preview/:formId`) — renders each
     competence with a 4-level rating (A *Maîtrisé* → D *Insuffisant*).
   - Edit / delete own forms. A teacher only sees forms they created.

### Student features

Student area (`/student`):

- **Join a class**: enter the class code, type ≥ 3 letters of the last
  name to retrieve matching students of the class, pick the right entry,
  and link the student record to the current user account.
- **My classes**: list of classes the student belongs to.
- **Pending forms**: list of forms sent by the teacher; clicking opens
  `/student/form/:formId` to fill it.
- Submission lands on a generic confirmation page (`/confirmation`).

### Evaluation grading scale

`A` Maîtrisé · `B` Satisfaisant · `C` Commencé · `D` Insuffisant.

### Known gaps in the current implementation

- The student→form delivery and submission pipeline is still wired to
  the mock layer in `services/api.js` (`sendFormToClass`,
  `getPendingFormsForStudent`, `submitStudentForm`, `updateStudentEvaluation`).
  There is no backing Sequelize model / route yet, so evaluations are
  not persisted to Postgres.
- Several teacher endpoints relied on `pendingStudents` / `students`
  array columns on `Class` that are not declared in the model.
- DB schema is created via `sequelize.sync({ alter: true })`; no
  migrations.

---

## 2. Architecture & Tech Choices

### High-level layout

```
┌────────────────┐  HTTPS/JSON  ┌────────────────┐  SQL  ┌──────────────┐
│  React SPA     │ ───────────▶ │  Express API   │ ────▶ │  PostgreSQL  │
│  (port 3000)   │  Bearer JWT  │  (port 5000)   │       │  (port 5432) │
└────────────────┘              └────────────────┘       └──────────────┘
```

Three Docker Compose services: `frontend`, `backend`, `db`. A second
compose file (`docker-compose.prod.yml`) covers production.

### Frontend — `auto-evaluation-app/`

- **React 18** bootstrapped with **Create React App** (`react-scripts`).
- **React Router v6** for routing, with role-based redirects in `App.js`.
- **State / data layer**:
  - `AuthContext` — owns the JWT, decodes it with `jwt-decode`, polls
    expiry, exposes `login` / `register` / `logout`.
  - `CompetencesContext` — loads and caches categories + competences +
    classes + forms once a user is logged in; exposes CRUD wrappers
    around the API client.
- **HTTP client**: `axios` instance in `services/api.js` with two
  interceptors:
  - request: attach `Authorization: Bearer <token>`.
  - response: on `401`, clear token and redirect to `/login`.
- **UI**: TailwindCSS + Radix UI primitives (Accordion, Checkbox,
  Dropdown, Radio, Select, Tabs…) composed in `components/ui/`
  shadcn-style, with `lucide-react` icons. Toasts via `react-hot-toast`.
- **Code organisation**:
  - `pages/` — top-level routed pages (`TeacherPage`, `ClassesPage`,
    `CompetencesPage`, `FormsPage`).
  - `components/` — feature components (`ClassDetail`,
    `StudentDashboard`, `FormPreview`…) + reusable `ui/` primitives.
  - `services/` — API client (and a mock layer used for the as-yet
    unimplemented submission flow).
  - `contexts/` — global state providers.

### Backend — `auto-evaluation-back/`

- **Node.js + Express 4** (`server.js` boots app, registers routes,
  syncs Sequelize models).
- **ORM**: **Sequelize 6** over `pg` (PostgreSQL) in dev/prod; switches
  to in-memory SQLite when `NODE_ENV=test` (`utils/sequelize.js`).
- **Auth**:
  - `bcryptjs` for password hashing (salt rounds = 10).
  - `jsonwebtoken` for signing/verifying JWTs (24 h TTL, secret in
    `JWT_SECRET`).
  - `middleware/auth.js` validates the bearer token and attaches
    `req.user`.
  - `middleware/isTeacher.js` restricts teacher-only endpoints.
- **CORS**: restricted to `FRONTEND_URL`, credentials allowed.
- **Domain models** (`models/`):
  - `User` — id, name, email (unique), password (hash), role
    (`teacher` | `student`).
  - `Class` — name, year, `teacherId` (FK User), `code` (unique join
    code, generated with `crypto.randomBytes`).
  - `Student` — firstName, lastName, `classId` (FK Class), `userId`
    (FK User, nullable until the student joins via the code).
  - `Category` — name, description, `createdBy` (FK User).
  - `Competence` — name, description, `controlPoints` (JSONB array),
    `categoryId`, `createdBy`.
  - `Formulaire` — title, `competences` (JSONB array of competence ids),
    `createdBy`.
- **Routes** (mounted under `/api`):
  - `/auth` — `POST /register`, `POST /login`.
  - `/classes` — class CRUD, code regeneration, student add / list,
    `/search-students`, `/join`.
  - `/categories` — category CRUD + `/:id/competences`.
  - `/competences` — competence CRUD.
  - `/formulaires` — form CRUD (scoped to `createdBy = req.user.id`).
- **Tests**: `jest` + `supertest` with SQLite in-memory (`npm test`).

### Why these choices

- **CRA + React Router + Tailwind/Radix** keeps the frontend a
  straightforward SPA with a small, modern component toolkit.
- **Express + Sequelize + Postgres** is a common, well-documented
  stack — quick to model a small relational schema (users, classes,
  students, categories, competences, forms).
- **JSONB columns** for `competences` (in `Formulaire`) and
  `controlPoints` (in `Competence`) avoid extra join tables for what
  are essentially ordered lists owned by the parent row, while still
  being queryable in Postgres.
- **JWT in `localStorage`** keeps the backend stateless. Acceptable
  for a small app; the README flags that refresh tokens and shorter
  TTLs should be added before production.
- **SQLite-in-memory for tests** removes the need for a Postgres
  instance in CI; the small dialect-specific bits (e.g. JSON vs JSONB
  in `Formulaire`) are handled via `sequelize.getDialect()`.
- **Docker Compose** gives a one-command local stack with persistent
  volume for Postgres data.
