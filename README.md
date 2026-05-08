# SUMMUS

A simplified note-taking app with AI chat, calendar, and authentication.

## Features

- User authentication
- Notes and workflow board
- AI chat backed by OpenAI
- Calendar events stored locally
- Data stored in MongoDB Atlas

## Local setup

1. Install dependencies for frontend and backend:
   - Frontend and Vercel function deps: `npm install` in root
   - Backend: `cd backend && npm install`

2. Configure the backend environment:
   - Copy `backend/.env.example` to `backend/.env`
   - Set `MONGO_URI` and `JWT_SECRET`
   - If your provider created `MONGODB_URI` instead, the backend now accepts that too
   - Set `OPENAI_API_KEY`
   - Optionally change `OPENAI_MODEL` if you want another OpenAI text model

3. Run the backend: `cd backend && npm run dev`

4. Run the frontend: `npm run dev`

5. Open http://localhost:5173

## Vercel deploy

- Keep frontend and backend in the same repository. A second backend-only repo is not necessary for this setup.
- The frontend uses `VITE_API_URL` when provided. In production it falls back to `/api`, which lets Vercel serve the Express backend from the same project.
- Add these environment variables in Vercel:
  - `MONGO_URI` or `MONGODB_URI`
  - `JWT_SECRET`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (optional)
- Import the GitHub repository into Vercel and deploy from the repo root.
- SPA navigation is handled through `vercel.json`, and the backend is exposed through the root `api/` functions.

## Usage

- Register or login
- Create and edit workflows
- Open the AI chat to generate or refine text
- Use the calendar to store events by day
