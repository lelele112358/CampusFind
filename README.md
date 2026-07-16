# CampusFind — PostgreSQL edition

CampusFind is a full-stack campus lost-and-found school project. The frontend
uses plain HTML, CSS, and browser JavaScript. The backend uses Node.js and
Express. All application records are stored in PostgreSQL.

This edition replaces MongoDB and Mongoose with:

- PostgreSQL tables and foreign keys
- parameterized SQL queries through the `pg` package
- SQL transactions for match confirmation, rejection, and item release
- automatic schema creation from `database/01_schema.sql`

Express serves both the website and `/api`, so the project needs only one web
service plus one PostgreSQL database.

## Main features

- Public account creation and login
- JWT-based user and administrator sessions
- bcrypt password hashing
- Lost-item reports with references such as `CF-2026-0001`
- Public status lookup by reference number and email
- User report history
- Administrator-only found-item entry
- Automatic candidate matching
- Confirm/reject workflow
- Transactional release workflow and audit log
- Optional private JPG, PNG, or PDF uploads limited to 5 MB
- Responsive light/dark interface

## Project structure

```text
CampusFind-PostgreSQL/
├── public/                     # Browser pages and assets
├── src/
│   ├── config/database.js      # PostgreSQL pool, startup schema, transactions
│   ├── controllers/
│   ├── middleware/
│   ├── repositories/           # Parameterized SQL data access
│   ├── routes/
│   ├── services/
│   ├── app.js
│   └── server.js
├── database/
│   ├── 01_schema.sql
│   ├── 02_sample_queries.sql
│   └── README.md
├── scripts/createAdmin.js
├── tests/
├── .env.example
├── render.yaml                 # Render Web Service + Render Postgres
├── render-neon.yaml            # Render Web Service + external Neon Postgres
└── package.json
```

## Database choices

### Option A: Render Postgres

Use `render.yaml`. It creates the web service and a Render Postgres database.
The application receives the internal database connection automatically.

Render's free Postgres instance is intended for testing and expires after 30
days. Upgrade it before expiration or export the data if the project must stay
online longer.

### Option B: Neon Postgres

Use `render-neon.yaml` as a reference (rename it to `render.yaml` before a Blueprint deploy), or create the Render web service manually. Create a Neon
Free database, copy its pooled PostgreSQL connection string, and set that value
as `DATABASE_URL` in Render. This is the better zero-cost choice when the class
project must remain available for more than 30 days.

The application is standard PostgreSQL and can also use Supabase, local
PostgreSQL, or another compatible provider.

## Run locally

### 1. Install Node.js and PostgreSQL

Use Node.js 20 or newer. You can either install PostgreSQL locally or use a
cloud PostgreSQL connection string.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

For local PostgreSQL without TLS:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/campusfind
PGSSLMODE=disable
JWT_SECRET=a-long-random-secret-at-least-32-characters
```

For Neon or another TLS cloud database:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
PGSSLMODE=require
JWT_SECRET=a-long-random-secret-at-least-32-characters
```

The server automatically creates all missing tables and indexes at startup.

### 4. Create the database locally if necessary

```bash
createdb campusfind
```

Alternatively, create it in pgAdmin.

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Create an administrator

Put these values in `.env`:

```env
ADMIN_NAME=CampusFind Administrator
ADMIN_EMAIL=admin@uregina.ca
ADMIN_PASSWORD=choose-a-password-with-at-least-12-characters
ADMIN_PHONE=306-585-4407
```

Then run:

```bash
npm run create-admin
```

The command creates the administrator or resets an existing account with that
email.

## Deploy with Render Postgres

1. Push this folder to GitHub.
2. In Render, choose **New → Blueprint**.
3. Select the repository containing `render.yaml`.
4. Approve the `campusfind` web service and `campusfind-db` database.
5. Wait for both resources to deploy.
6. Add the admin variables to the web service, then run `npm run create-admin`
   from your computer using the database's external URL, or create the admin
   before deployment against the same database.

The Blueprint sets:

```text
Build command: npm install
Start command: npm start
Health check: /api/health
```

## Deploy on Render with Neon

1. Create a Neon Free project and database.
2. Copy the pooled connection string.
3. Create a Render **Web Service** from the GitHub repository.
4. Use `npm install` as the build command and `npm start` as the start command.
5. Add these environment variables:

```text
NODE_ENV=production
DATABASE_URL=<Neon pooled PostgreSQL URL>
PGSSLMODE=require
JWT_SECRET=<long random value>
JWT_EXPIRES_IN=7d
```

Do not create a Render Postgres database for this option.

## Upload warning

The database records persist, but uploaded files are currently written to the
web service's local filesystem. Render's free web-service filesystem is
ephemeral, so files can disappear after a restart, sleep, or redeploy. Do not
use real identification documents for the classroom demo. A real deployment
should store private files in durable object storage.

## Tests

```bash
npm test
```

The included tests verify the item-matching calculation. Database integration
requires a running PostgreSQL database and is tested by starting the app.

## Important project note

This is a classroom prototype and not an official University of Regina system.
A real deployment would require institutional approval, privacy review,
durable encrypted file storage, data-retention rules, backups, and stronger
operational controls.
