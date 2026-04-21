# DSA Visualizer Full Stack

A full-stack DSA visualizer built for exam evaluation. The project keeps the original React visualization workspace and adds:

- Express API with JWT authentication
- MySQL-ready persistence layer with a memory fallback for local testing
- Saved code, execution logs, visualization history, and dashboard summaries
- Restricted backend execution/trace generation for supported DSA patterns
- Automated backend and frontend tests

## Architecture

- `client/`: Vite + React frontend with auth, dashboard, save/load, and API execution flows
- `server/`: Express API, auth middleware, repository layer, validation, and tests
- `server/src/config/schema.sql`: MySQL schema for PlanetScale or local MySQL

## Features

- Demo mode visualizer still works without logging in
- Signup and login with JWT auth
- Save code with tags and test inputs
- Load and delete saved code from the dashboard
- Execute supported code through the backend and render returned traces
- Save generated visualizations and review activity summaries

## Supported Backend Execution

The backend intentionally does **not** run arbitrary code. For the exam MVP it:

- accepts `javascript`, `python`, and `cpp`
- validates payload size and blocks obviously dangerous tokens
- detects the closest supported DSA pattern
- generates structured traces for `binarySearch` and `tree`
- returns standardized demo traces for the remaining supported patterns

## Local Setup

### 1. Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Or use:

```bash
npm run install:all
```

### 2. Configure environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Important values:

- `CLIENT_ORIGIN=http://localhost:5173`
- `PORT=4000`
- `JWT_SECRET=...`
- `MYSQL_URL=` or `MYSQL_HOST` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE`
- `VITE_API_BASE_URL=http://localhost:4000`

If no MySQL credentials are provided, the API uses an in-memory repository. That is useful for local demos and automated tests, but exam deployment should point to MySQL/PlanetScale.

### 3. Start the app

```bash
npm run dev
```

This runs:

- frontend on `http://localhost:5173`
- backend on `http://localhost:4000`

## Database

Use the schema in [server/src/config/schema.sql](/Users/dakshgour/Desktop/new_fullstackproject/server/src/config/schema.sql).

Tables:

- `users`
- `saved_codes`
- `visualizations`
- `execution_logs`
- `test_cases`

## API Summary

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Codes:

- `POST /api/codes`
- `GET /api/codes`
- `GET /api/codes/:id`
- `PUT /api/codes/:id`
- `DELETE /api/codes/:id`

Execution:

- `POST /api/execute`
- `GET /api/execute`
- `GET /api/execute/:id`

Visualizations:

- `POST /api/visualizations`
- `GET /api/visualizations`
- `GET /api/visualizations/:id`

Progress:

- `GET /api/progress/summary`
- `GET /api/progress/dashboard`

A Postman collection is included at [postman/DSA_Visualizer.postman_collection.json](/Users/dakshgour/Desktop/new_fullstackproject/postman/DSA_Visualizer.postman_collection.json).

## Scripts

Root:

- `npm run dev`
- `npm run build`
- `npm run test`

Frontend:

- `npm run dev --prefix client`
- `npm run build --prefix client`
- `npm run test --prefix client`

Backend:

- `npm run dev --prefix server`
- `npm run build --prefix server`
- `npm run test --prefix server`

## Testing

Backend coverage includes:

- signup/login/me
- token protection
- saved code CRUD and ownership boundaries
- execution success and rejection paths
- dashboard aggregation

Frontend coverage includes:

- signup form validation
- protected route redirect
- dashboard render after token restore

## Deployment

Recommended exam deployment targets:

- frontend: Vercel
- backend: Railway or Render
- database: PlanetScale MySQL

Deployment checklist:

1. Set backend environment variables including JWT and MySQL connection.
2. Run the SQL schema on the target database.
3. Set `CLIENT_ORIGIN` on the backend to the frontend URL.
4. Set `VITE_API_BASE_URL` on the frontend to the deployed backend URL.
5. Run `npm run build` locally before shipping.

## Demo Credentials

Create a demo user with:

- email: `demo@example.com`
- password: `SecurePass123!`

Sample binary search input:

```text
array: [2,5,8,12,16,23,38] target: 23
```
