# my-invoice-app — Backend

Node.js + Express + MongoDB (Mongoose) REST API for the `my-invoice-app` frontend.

## Stack & why

- **Express 4** — routing/middleware
- **Mongoose 8** — MongoDB ODM, connection pooling
- **JWT + bcryptjs** — stateless auth, hashed passwords (cost factor 12)
- **helmet, cors, express-mongo-sanitize, hpp, express-rate-limit** — security hardening
- **compression** — gzip responses (fast)
- **express-validator** — input validation on every write route
- **winston + morgan** — structured logging
- **pdfkit** — generates invoice PDFs in-memory (no disk writes → safe on ephemeral hosting)
- **nodemailer** — emails invoices to clients
- **express-async-errors** — async route errors are caught automatically

## Folder structure

```
backend/
  src/
    config/db.js              MongoDB connection
    controllers/               route handler logic
    middleware/                auth guard, validation, rate limiting, error handler
    models/                    User, Client, Invoice (Mongoose schemas)
    routes/                    /api/v1/auth, /clients, /invoices
    utils/                     logger, PDF generator, email sender, helpers
    app.js                     Express app (all middleware wired up)
    server.js                  entrypoint: connects DB, starts server, graceful shutdown
  .env.example
  .gitignore
  package.json
  Procfile                     for Heroku-style platforms
```

## Local setup

```bash
cd backend
cp .env.example .env      # then fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                # nodemon, auto-restarts on change
```

Requires a running MongoDB instance — either local (`mongod`) or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended, since it
works the same in dev and once deployed).

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## API overview

All routes are prefixed `/api/v1`.

| Method | Route                        | Auth | Description                        |
|--------|-------------------------------|------|-------------------------------------|
| POST   | `/auth/signup`                | ❌   | Create account                      |
| POST   | `/auth/login`                 | ❌   | Log in, returns JWT                 |
| POST   | `/auth/logout`                | ❌   | Clear auth cookie                   |
| GET    | `/auth/me`                    | ✅   | Current user                        |
| PATCH  | `/auth/update-me`             | ✅   | Update profile/company              |
| PATCH  | `/auth/update-password`       | ✅   | Change password                     |
| GET    | `/clients`                    | ✅   | List clients (paginated, `?search=`)|
| POST   | `/clients`                    | ✅   | Create client                       |
| GET    | `/clients/:id`                | ✅   | Get one client                      |
| PATCH  | `/clients/:id`                | ✅   | Update client                       |
| DELETE | `/clients/:id`                | ✅   | Delete client                       |
| GET    | `/invoices`                   | ✅   | List invoices (`?status=&client=`)  |
| POST   | `/invoices`                   | ✅   | Create invoice (totals auto-computed)|
| GET    | `/invoices/:id`                | ✅   | Get one invoice                     |
| PATCH  | `/invoices/:id`                | ✅   | Update invoice                      |
| DELETE | `/invoices/:id`                | ✅   | Delete invoice                      |
| GET    | `/invoices/:id/pdf`             | ✅   | Download invoice as PDF             |
| POST   | `/invoices/:id/send`            | ✅   | Email invoice PDF to the client     |
| GET    | `/health`                      | ❌   | Health check                        |

Authenticated requests: send `Authorization: Bearer <token>` (the token is
also set as an httpOnly cookie on login/signup, so browser clients get it
automatically).

**Security model:** every client/invoice is scoped to `req.user.id` — one
user can never read or modify another user's data, enforced at the query
level in every controller.

## Connecting your React frontend

In `invoicing-app`, set the API base URL via an env var (e.g. `.env` in the
CRA/Vite app: `VITE_API_URL=http://localhost:5000/api/v1` or
`REACT_APP_API_URL=...`), and set `credentials: 'include'` on fetch/axios
calls if you want to rely on the httpOnly cookie instead of manually
attaching the Bearer token.

## Deploying

This backend is stateless and deploy-ready for **Render**, **Railway**, or
**Heroku**:

1. Push this repo to GitHub (see below).
2. Create a MongoDB Atlas cluster, allow network access from anywhere (or the
   platform's IP range), copy the connection string into `MONGO_URI`.
3. On Render/Railway: New Web Service → point at this repo → set **Root
   Directory** to `backend` → build command `npm install` → start command
   `npm start` → add the same env vars as `.env.example`.
4. Update `CLIENT_ORIGIN` to your deployed frontend's URL, and update the
   frontend's API URL to point at the deployed backend.

## Publishing this backend to your existing GitHub repo

From your local machine (not from here — I don't have push access to your
GitHub account):

```bash
# 1. Clone your existing repo if you don't already have it locally
git clone https://github.com/manthanbhavsar5598-bit/my-invoice-app.git
cd my-invoice-app

# 2. Copy this "backend" folder into the repo root, next to "invoicing-app"
#    (so the repo root has: invoicing-app/  backend/)

# 3. Stage, commit, and push
git add backend
git commit -m "Add Node.js/Express/MongoDB backend"
git push origin main
```

From then on, any change to either folder is just:
```bash
git add .
git commit -m "your message"
git push
```
Both frontend and backend live in one repo and history, but stay in their
own folders — so `cd backend && npm run dev` and `cd invoicing-app && npm
start` remain independent.
