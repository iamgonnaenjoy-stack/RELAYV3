# Railway Deploy

This repo is prepared for three Railway services from the same monorepo:

- `backend`
- `frontend`
- `admin`

Each app now includes a `railway.json` file in its own package root so Railway can pick up build and deploy settings per service.

## Services

### Backend

- Package root: `apps/backend`
- Build command: `pnpm --filter backend db:generate && pnpm --filter backend build`
- Start command: `pnpm --filter backend start`
- Healthcheck: `/health`

### Frontend

- Package root: `apps/frontend`
- Build command: `pnpm --filter frontend build`
- Start command: `pnpm --filter frontend start`
- Healthcheck: `/`

### Admin

- Package root: `apps/admin`
- Build command: `pnpm --filter admin build`
- Start command: `pnpm --filter admin start`
- Healthcheck: `/`

The frontend and admin apps use a tiny Node SPA server so Railway can serve the built `dist` folder with client-side route fallback:

- member app fallback keeps `/app/*` working
- admin app fallback keeps `/dashboard` working

## Railway Setup

Create one Railway project with these services:

1. `backend`
2. `frontend`
3. `admin`
4. PostgreSQL

When importing from GitHub, use the monorepo package selection flow and select:

- `apps/backend`
- `apps/frontend`
- `apps/admin`

## Variables

### Backend variables

Set these on the `backend` service:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_ACCESS_SECRET=<strong-random-secret>`
- `JWT_REFRESH_SECRET=<strong-random-secret>`
- `JWT_ACCESS_EXPIRES=15m`
- `JWT_REFRESH_EXPIRES=7d`
- `ADMIN_ACCESS_KEY=<your-admin-login-key>`
- `ADMIN_DISPLAY_NAME=Relay Admin`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://<frontend-domain>,https://<admin-domain>`

### Frontend variables

Set these on the `frontend` service:

- `VITE_API_URL=https://<backend-domain>`
- `VITE_WS_URL=https://<backend-domain>`

### Admin variables

Set these on the `admin` service:

- `VITE_API_URL=https://<backend-domain>`

## Deployment Order

1. Deploy PostgreSQL
2. Deploy `backend`
3. Generate a public domain for `backend`
4. Add the backend domain to `frontend` and `admin` variables
5. Deploy `frontend`
6. Deploy `admin`
7. Add the frontend/admin public domains into `backend` `CORS_ORIGIN`
8. Redeploy `backend`

## Post Deploy Smoke Test

1. Open the admin website
2. Log in with `ADMIN_ACCESS_KEY`
3. Set the server name
4. Create one text channel
5. Create one invited user
6. Copy the generated access key
7. Open the member app
8. Log in with that access key
9. Send a message and confirm realtime delivery
