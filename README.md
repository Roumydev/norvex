# Norvex — Real Estate CRM & ERP

A bilingual (English / Arabic, RTL-ready) web platform for Algerian real estate agencies. It manages the whole sales pipeline in one place: **properties, clients, leads, visits, contracts and payments**, with role-based access for agency admins and agents.

> Full-stack project: **Next.js + NestJS + MongoDB**, built end to end (UI, REST API, data model, auth and role-based data scoping).

<!-- Replace the paths below with your own screenshots (docs/screenshots/) -->
![Dashboard](docs/screenshots/01-dashboard.png)

## Features

- **Dashboard** — KPIs (properties, active leads, scheduled visits, closed deals, revenue), revenue trend, property status, monthly deals, leads funnel, today's visits.
- **Properties** — CRUD, photo gallery (up to 8 photos, cover image, automatic client-side resize), filters, pagination.
- **Clients & Leads** — client profiles with a real activity timeline; leads on a drag-and-drop **kanban** board (or table).
- **Visits** — list and **calendar** views, status tracking (scheduled, completed, cancelled, no-show).
- **Contracts** — sale and rent contracts, payment progress, **PDF upload / download** per contract.
- **Payments** — paid / pending / overdue tracking, CSV export. Paid payments update the contract's paid amount automatically.
- **Analytics** — revenue, average deal size, conversion and collection rates, agent performance, city breakdown, funnel; exportable to CSV.
- **Global search** in the top bar (properties, clients, agents) with keyboard navigation.
- **Team management (admin)** — create accounts, link an account to an agent profile, reset passwords.
- **Settings** — agency information and notification preferences, stored in the database and shared across devices.
- **Bilingual UI** — English and Arabic with RTL layout, light / dark mode.

## Roles and data access

| | Admin | Agent |
|---|---|---|
| Clients, leads, visits, contracts, payments | Everything | Only records assigned to the agent's profile |
| Properties | Everything | Shared catalogue (create / edit); dashboard counts own listings |
| Delete records | Yes | No |
| Team, settings, analytics for the whole agency | Yes | Settings: read only |

Access rules are enforced **on the server** (not only hidden in the UI): an agent cannot read, edit or reassign another agent's records, even by calling the API directly.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Recharts, Axios, custom CSS design system |
| Backend | NestJS, TypeScript, Mongoose, Passport (JWT), class-validator, bcryptjs, Multer |
| Database | MongoDB (Atlas) |
| Auth | JWT bearer tokens, bcrypt-hashed passwords, role guards |

## Project structure

```
norvex/
├── backend/            NestJS REST API (src/<module>/{controller,service,dto,entities})
├── frontend/           Next.js app (src/views, src/components, src/context, src/i18n)
└── docs/screenshots/
```

## Getting started

**Requirements:** Node.js 20+, a MongoDB database (a free Atlas cluster is enough).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values
```

`.env`:

```
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<db_name>?appName=Cluster0
PORT=4000
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
```

Create the first admin (registration is admin-only, so the first account is created by script):

```bash
node seed-admin.js admin@yourdomain.com "A-strong-password"
npm run start:dev           # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

The API URL is set in `frontend/src/lib/api.ts` (default `http://localhost:4000`) and the allowed origins in `backend/src/main.ts`.

### 3. Demo data (optional)

```bash
cd backend
node seed-demo.js           # adds 3 agents, 12 properties with photos, clients, leads, visits, contracts, payments
node seed-demo.js --reset   # removes only the demo data
```

Demo accounts (password for all: `Demo@12345`):

| Role | Email |
|---|---|
| Admin | `demo.admin@demo.norvex.dz` |
| Agent | `yacine@demo.norvex.dz`, `samira@demo.norvex.dz`, `karim@demo.norvex.dz` |

> Change or remove the demo accounts before exposing an instance publicly.

## API overview

| Module | Endpoints (all require a JWT unless noted) |
|---|---|
| Auth | `POST /auth/login` (public), `GET /auth/me`, `POST /auth/change-password`, `POST /auth/register` (admin) |
| Users | `GET/POST /users`, `PATCH/DELETE /users/:id` (admin) |
| Agents, Clients, Leads, Visits | `GET/POST /<module>`, `GET/PATCH /<module>/:id`, `DELETE` (admin) |
| Contracts | CRUD + `POST/GET/DELETE /contracts/:id/document` |
| Payments | CRUD |
| Properties | CRUD + `POST /properties/:id/images`, `PATCH .../images/:imageId/cover`, `DELETE .../images/:imageId`; `GET /property-images/:id` (public) |
| Settings | `GET /settings`, `PATCH` and `DELETE /settings` (admin) |
| Search | `GET /search?q=` |

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- Request bodies are validated and whitelisted (class-validator); unknown fields are dropped.
- Role and agent link are read from the database on every request, so deleting a user or changing a role takes effect immediately.
- Uploads are checked by file signature (PDF, JPEG, PNG, WebP), size-limited, and stored in MongoDB.
- Search input is regex-escaped.
- Secrets live in `.env` (git-ignored); `.env.example` documents the variables.

## Screenshots

| | |
|---|---|
| ![Properties](docs/screenshots/02-properties.png) | ![Property](docs/screenshots/03-property.png) |
| ![Leads](docs/screenshots/04-leads.png) | ![Visits](docs/screenshots/05-visits.png) |
| ![Contracts](docs/screenshots/06-contract.png) | ![Analytics](docs/screenshots/07-analytics.png) |
| ![Arabic](docs/screenshots/08-arabic.png) | ![Agent view](docs/screenshots/09-agent.png) |

## Known limitations and next steps

- Single agency (no multi-tenant separation).
- No email / SMS delivery; notifications are in-app only.
- No automated test suite yet (only the NestJS scaffolding specs).
- Signed-in sessions stay valid until the token expires (7 days); a token revocation list is not implemented.
- Planned: environment-based API URL and CORS, audit log, backups, rate limiting, Swagger docs, end-to-end tests, Docker setup.

## License

MIT (or your choice).
