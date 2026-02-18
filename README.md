# Moving Box - Real-time Collaborative Drag Application

A real-time web application where multiple users can drag a box simultaneously and see each other's movements instantly. Built with React, Cloudflare Workers, Durable Objects, and Supabase Auth.

## Project Overview

This project consists of two main parts:

- **Frontend**: React + Vite application with shadcn/ui components
- **Backend**: Cloudflare Worker with Hono + Durable Objects for real-time sync

## Architecture

### Frontend (React + Vite)

- React 18 with TypeScript
- Vite for fast development and building
- shadcn/ui components for polished UI
- Supabase Auth for authentication
- WebSocket client for real-time communication

### Backend (Cloudflare Workers)

- Hono framework for lightweight API
- Durable Objects for WebSocket connections and state persistence
- JWT verification with Supabase
- KV storage for user profile caching
- CORS configured for local development

## Features

- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Real-time box dragging with WebSocket
- ✅ Multi-user synchronization
- ✅ Connection status indicator
- ✅ Persistent box position across sessions
- ✅ Clean, responsive UI with shadcn/ui

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Frontend  | React, TypeScript, Vite, shadcn/ui, Tailwind CSS |
| Backend   | Cloudflare Workers, Hono, Durable Objects        |
| Auth      | Supabase Auth                                    |
| Database  | Supabase PostgreSQL                              |
| Real-time | WebSockets, Durable Objects                      |
| Caching   | Cloudflare KV                                    |

## Project Structure

moving-box/

- frontend/ # React frontend application
- - src/
- - - components/ # UI components
- - - lib/ # Utilities
- - - App.tsx # Main application
- - - main.tsx # Entry point
- - index.html
- - package.json
    │
- backend/ # Cloudflare Worker backend
- - src/
- - - index.ts # Main worker
- - - boRoom.ts # Durable Object
- - wrangler.jsonc # Worker configuration
- - package.json
    │
- README.md

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/PraiseMassa/moving-box.git
   cd moving-box

   ```

2. **Set up environment variables**

#### Frontend (.env in /frontend):

VITE_SUPABASE_URL=your_supabase_url \
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

3. **Install dependencies**

#### Backend:

cd backend
npm install

#### Frontend:

cd frontend
npm install

## Running Locally

### Start the backend

cd backend \
npm run dev \
Backend runs on http://localhost:8787

### Start the frontend

cd frontend \
npm run dev \
Frontend runs on http://localhost:5173 \
 \
Open two browser tabs at http://localhost:5173 and drag the box!

### How It Works

Authentication: User logs in via Supabase Auth \
WebSocket Connection: Frontend connects to backend with JWT token \
Durable Object: Backend creates/joins a room identified by user \
Real-time Updates: Box position changes broadcast to all connected clients \
Persistence: Box position saved to Durable Object storage

## Testing

### Test Multi-user Sync

Open two browser windows \
Log in with different accounts (or same account) \
Drag the box in one window \
Watch it move in the other window instantly

### Test Persistence

Drag box to a new position \
Close and reopen the tab \
Box returns to last position

## Screenshots

### Login Screen

Login-Signup page.png \
Clean authentication UI with email/password and Google options

### Main Application

mainApp.png \
Draggable box with connection status indicator

### Real-time Sync

movingboxgif.mp4 \
Box position syncs across multiple browser tabs
