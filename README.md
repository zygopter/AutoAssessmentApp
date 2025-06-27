# Auto-Evaluation Project

A simple full-stack web application for student self-evaluation, with a React/TypeScript frontend, an Express/Sequelize/Node.js backend and a local PostgreSQL database.

---

## ⚙️ Prerequisites

* [Docker & Docker Compose](https://docs.docker.com/compose/install/)
* [Node.js](https://nodejs.org/) (v16+) and npm
* *(optional)* [DBeaver](https://dbeaver.io/) (or another PostgreSQL GUI)

---

## 🚀 Quickstart with Docker Compose

From the project root (where `docker-compose.yml` lives):

1. **Build & start** all services (db, backend, frontend)

   ```bash
   docker-compose up --build
   ```
2. **Frontend** is available at [http://localhost:3000](http://localhost:3000)
3. **Backend API** runs on [http://localhost:5000](http://localhost:5000)
4. **Shut down** without losing data:

   ```bash
   docker-compose down
   ```

   > To reset the database (DELETES ALL DATA):
   >
   > ```bash
   > docker-compose down -v
   > ```

---

## ⚙️ Developing Locally (without Docker)

### Backend

```bash
cd auto-evaluation-back
npm install
cp .env.example .env        # set DATABASE_URL (e.g. postgresql://user:password@localhost:5432/hello_db)
                             # set JWT_SECRET, FRONTEND_URL=http://localhost:3000
npm run start
```

* Runs on [http://localhost:5000](http://localhost:5000)
* Swagger API docs at [http://localhost:5000/docs](http://localhost:5000/docs)

### Frontend

```bash
cd auto-evaluation-app
npm install
cp .env.example .env        # set REACT_APP_API_URL=http://localhost:5000/api
npm run start
```

* Opens at [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
.
├── auto-evaluation-app     # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── contexts/       # AuthContext, global state
│       ├── services/       # API client (Axios)
│       └── components/
└── auto-evaluation-back    # Express + Sequelize backend
    ├── models/             # Sequelize model definitions
    ├── routes/             # Express route handlers
    ├── utils/
    │   └── sequelize.js    # DB connection (Postgres / SQLite test)
    └── server.js           # Express app setup
```

---

## 🗄️ Inspecting the Database with DBeaver

1. **Start** your Docker Compose stack (must have `db` running).
2. **Open DBeaver** → **New Database Connection** → **PostgreSQL**.
3. Enter:

   * **Host**: `localhost`
   * **Port**: `5432`
   * **Database**: `hello_db`
   * **Username**: `user`
   * **Password**: `password`
4. Click **Test Connection** → **Finish**.
5. In **Database Navigator**, expand:

   ```
   hello_db
   └── Schemas
       └── public
           └── Tables
               ├── users
               ├── classes
               ├── competences
               ├── formulaires
               └── students
   ```
6. Double-click a table → **Data** tab to browse/edit rows.
7. Right-click → **SQL Editor** to run custom queries.

---

## 🛠️ Next Steps

* Replace `sync({ alter: true })` with explicit [Sequelize migrations](https://sequelize.org/master/manual/migrations.html) before production.
* Add end-to-end tests (e.g. Cypress) for the full UI/API flow.
* Secure tokens & refresh flows in production (longer `expiresIn` and refresh tokens).

---
