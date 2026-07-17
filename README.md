# CampusFind

**CampusFind** is a full-stack lost-and-found web application designed for the University of Regina campus community. It gives students and campus users a secure way to report lost items and check claim status, while allowing authorized Protective Services staff to record found items, review possible matches, and document item releases.

> **Academic project notice:** CampusFind is a CS 476 group project and is not an official University of Regina or Protective Services system.

## Live Project

- **Website:** [https://campusfind-zitd.onrender.com](https://campusfind-zitd.onrender.com)
- **GitHub repository:** [https://github.com/lelele112358/CampusFind](https://github.com/lelele112358/CampusFind)
- **Health check:** [https://campusfind-zitd.onrender.com/api/health](https://campusfind-zitd.onrender.com/api/health)

The free Render instance may take approximately 30–60 seconds to wake after a period of inactivity.

## Project Goals

CampusFind was created to improve the campus lost-and-found process by:

- Providing one place for users to submit lost-item reports.
- Generating a unique reference number for every report.
- Allowing users to check the status of a report securely.
- Keeping found-item records and private verification details restricted to administrators.
- Suggesting possible matches between lost reports and found items.
- Maintaining an audit log when an item is released.

## Main Features

### Public users

- Create an account with contact information.
- Log in using email and password.
- Submit a lost-item report.
- Optionally upload a supporting image or PDF.
- Receive a sequential reference number such as `CF-2026-0001`.
- View previously submitted reports.
- Check report status using a reference number and email address.

### Administrators

- Use a separate administrator login.
- View dashboard totals for open reports, items in holding, and pending matches.
- Record items physically delivered to Protective Services.
- Store private verification notes that are not returned by public endpoints.
- Review automatically generated match candidates.
- Confirm or reject a match.
- Record the release of an item and create an audit entry.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Database client | `pg` with connection pooling and parameterized queries |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password security | `bcryptjs` |
| File uploads | `multer` |
| HTTP security | `helmet`, rate limiting, request-size limits |
| Hosting | Render Web Service |
| Cloud database | Neon PostgreSQL |
| Version control | Git and GitHub |

## System Architecture

```text
Browser
  │
  │ HTTPS requests
  ▼
Render Web Service
  ├── Static HTML, CSS, and JavaScript
  └── Node.js / Express REST API
          │
          │ Parameterized SQL queries
          ▼
      Neon PostgreSQL
```

Express serves both the frontend and the REST API, so the deployed application requires only one web service and one PostgreSQL database.

## Project Structure

```text
CampusFind/
├── public/                         # Frontend pages and browser assets
│   ├── assets/
│   │   ├── css/styles.css
│   │   ├── images/
│   │   └── js/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── report.html
│   ├── claim-success.html
│   ├── admin-login.html
│   └── admin-dashboard.html
├── src/
│   ├── config/database.js          # PostgreSQL pool and schema initialization
│   ├── constants/                  # Shared item categories
│   ├── controllers/                # Request handling and responses
│   ├── middleware/                 # Authentication, uploads, and error handling
│   ├── repositories/               # Parameterized SQL data-access functions
│   ├── routes/                     # REST API route definitions
│   ├── services/                   # Matching and reference-number logic
│   ├── utils/                      # Validation and error helpers
│   ├── app.js                      # Express application configuration
│   └── server.js                   # Database connection and server startup
├── database/
│   ├── 01_schema.sql               # Tables, constraints, and indexes
│   ├── 02_sample_queries.sql        # Example SQL workflow queries
│   └── README.md
├── scripts/createAdmin.js          # Creates or updates an admin account
├── tests/matching.test.js           # Matching-service unit tests
├── uploads/private/                # Local private upload directories
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```

## Database Design

CampusFind uses six relational tables.

| Table | Purpose |
|---|---|
| `users` | Stores public users and administrators, distinguished by role. |
| `lost_reports` | Stores reports submitted by authenticated public users. |
| `found_items` | Stores items received and entered by administrators. |
| `item_matches` | Links lost reports to possible found-item matches. |
| `release_logs` | Records completed releases for accountability. |
| `lost_report_counters` | Generates sequential yearly reference numbers. |

Foreign keys maintain relationships between records, while checks and unique constraints enforce valid roles, statuses, scores, and reference numbers. Database indexes are included for commonly searched fields such as email, status, category, dates, and reference number.

### Main status workflows

```text
Lost report:
Open → Matched → Pending Verification → Resolved
                                  └────→ Closed

Found item:
In Holding → Matched → Released
                       └────────→ Disposed

Item match:
Pending Review → Confirmed
               └──────→ Rejected
```

## Automatic Matching

When an administrator records a found item, CampusFind searches eligible lost reports and calculates a score from 0 to 100.

| Matching factor | Maximum score |
|---|---:|
| Same item category | 45 |
| Similar words in item name/title | 30 |
| Similar words in location | 15 |
| Date proximity | 10 |
| **Total** | **100** |

Text similarity uses token-based Jaccard similarity after punctuation and common stop words are removed. Matches scoring below 45 are not stored.

| Score | Classification |
|---:|---|
| 75–100 | High |
| 58–74 | Medium |
| 45–57 | Low |
| Below 45 | Manual review / not automatically stored |

The matching score is intended to support administrator review; it does not automatically release an item.

## API Overview

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Create a public user account. |
| `POST` | `/api/auth/login` | Public | Log in as a public user. |
| `POST` | `/api/auth/admin/login` | Public | Log in as an administrator. |
| `GET` | `/api/auth/me` | Authenticated | Return the current user. |

### Lost reports

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/lost-reports` | User | Submit a lost-item report. |
| `GET` | `/api/lost-reports/mine` | User | Return the current user’s reports. |
| `GET` | `/api/lost-reports/status` | Public | Check status by reference number and email. |

### Administration

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Return dashboard metrics and recent activity. |
| `POST` | `/api/found-items` | Admin | Record a found item and generate candidate matches. |
| `PATCH` | `/api/matches/:id/confirm` | Admin | Confirm a candidate match. |
| `PATCH` | `/api/matches/:id/reject` | Admin | Reject a candidate match. |
| `POST` | `/api/release/:id` | Admin | Release an item and create an audit log. |

### Health check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Confirms that the web service is running. |

## Local Installation

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database, either local or cloud-hosted
- Git

### 1. Clone the repository

```bash
git clone git@github.com:lelele112358/CampusFind.git
cd CampusFind
```

HTTPS may also be used:

```bash
git clone https://github.com/lelele112358/CampusFind.git
cd CampusFind
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
```

Add the following values to `.env`:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require
PGSSLMODE=require
PG_POOL_MAX=10

JWT_SECRET=replace-with-a-random-value-at-least-32-characters
JWT_EXPIRES_IN=7d

ADMIN_NAME=CampusFind Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-password-of-at-least-12-characters
ADMIN_PHONE=306-585-4407
```

Generate a secure JWT secret on macOS or Linux with:

```bash
openssl rand -hex 32
```

Never commit `.env` to GitHub.

### 4. Create the administrator

```bash
npm run create-admin
```

This command also verifies the database connection and applies the SQL schema if the required tables do not yet exist.

### 5. Start the application

Development mode:

```bash
npm run dev
```

Production-style mode:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Available npm Commands

| Command | Purpose |
|---|---|
| `npm start` | Start the application using `node src/server.js`. |
| `npm run dev` | Start with Node’s watch mode for development. |
| `npm run create-admin` | Create or update the administrator account from `.env`. |
| `npm test` | Run the Node test suite. |

## Deployment

The submitted deployment uses a Render Web Service connected to a Neon PostgreSQL database.

### Render settings

```text
Runtime: Node
Branch: main
Root directory: blank
Build command: npm ci --registry=https://registry.npmjs.org/
Start command: npm start
Health check path: /api/health
```

### Render environment variables

```text
NODE_ENV=production
DATABASE_URL=<Neon pooled PostgreSQL connection string>
PGSSLMODE=require
PG_POOL_MAX=10
JWT_SECRET=<private random value of at least 32 characters>
JWT_EXPIRES_IN=7d
```

`PORT` is not added manually because Render supplies it automatically.

## Testing

Run the included automated tests with:

```bash
npm test
```

The included unit tests verify important matching behavior, including match-score calculation and similarity classification.

The deployed system was also manually tested for:

- Public account registration and login
- Administrator login
- Lost-report submission
- Reference-number generation
- Status lookup
- PostgreSQL record creation
- Found-item entry
- Candidate-match generation
- Render-to-Neon database connectivity
- Health-check response

## Security and Privacy Measures

CampusFind includes the following safeguards:

- Passwords are hashed with bcrypt and are never stored as plain text.
- JWTs are signed using a private environment variable.
- User and administrator routes use role-based authorization.
- Login and signup endpoints are rate-limited.
- SQL is executed using parameterized queries.
- Helmet adds common HTTP security headers.
- Request body sizes are limited.
- Uploads accept one JPG, PNG, or PDF file up to 5 MB.
- Private verification notes are restricted to administrator workflows.
- Credentials and secrets are excluded from Git through `.gitignore`.

## Known Limitations

- Render’s free web service can sleep after inactivity, causing a slower first request.
- Uploaded files are stored on the Render service’s local filesystem, which is ephemeral. Files may disappear after a restart or redeployment.
- The prototype does not send email or SMS notifications.
- The matching system uses a transparent rule-based score rather than image recognition or machine learning.
- The system has not undergone an institutional privacy, accessibility, or security audit.
- Real identification documents should not be used in the classroom deployment.

## Future Improvements

- Store uploads in durable private object storage such as Amazon S3 or Cloudinary.
- Add email notifications when a likely match is found.
- Add password-reset and account-verification workflows.
- Add pagination, search, and advanced filters to the admin dashboard.
- Add full database integration and end-to-end browser tests.
- Add retention and automatic disposal reminders for unclaimed items.
- Improve accessibility testing and keyboard navigation.
- Add an administrator interface for user management and audit reporting.

## Academic and Legal Disclaimer

CampusFind is a classroom prototype. It is not affiliated with, endorsed by, or operated by the University of Regina or University of Regina Protective Services. A real institutional deployment would require formal approval, privacy and security review, encrypted durable file storage, data-retention policies, backups, accessibility validation, and operational monitoring.

## Project Team

Developed by the **CampusFind CS 476 project team** at the University of Regina.

---

**Last updated:** July 2026
