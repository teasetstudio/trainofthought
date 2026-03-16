# Train of Thought

## Setup
1. Install dependencies:
	- `npm install`
2. Create environment file:
	- `cp .env.example .env`
3. Run database migration (SQLite):
	- `npx prisma migrate dev --name init_auth`

## Run
- Start app in dev mode:
  - `npm run dev`

## Auth architecture (Express + WebSocket)
- Express serves static pages and auth endpoints under `/api/auth`.
- Login/register return a JWT and user profile.
- Frontend stores JWT in localStorage session data.
- WebSocket connection includes token in query string (`/ws?token=...`).
- Server verifies token during ws connection and derives actor identity from token, not from client-sent `userId` payload.
- Protected pages redirect to `/login` when session is missing.