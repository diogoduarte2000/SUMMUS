# SUMMUS

A simplified Notion-like note-taking app with Claude AI theme.

## Features

- User authentication
- Basic note editor
- Data stored in MongoDB Atlas

## Setup

1. Install dependencies for frontend and backend:
   - Frontend: `npm install` in root
   - Backend: `cd backend && npm install`

2. Set up MongoDB Atlas:
   - Create a cluster
   - Update `backend/.env` with your MONGO_URI and JWT_SECRET

3. Run the backend: `cd backend && npm run dev`

4. Run the frontend: `npm run dev`

5. Open http://localhost:5173

## Usage

- Register or login
- Start writing notes in the editor
- Save to persist