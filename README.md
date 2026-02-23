# Visual Sourcing Platform

A B2B Jewellery Sourcing Platform that enables buyers to upload reference images and receive manufacturable recommendations.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express, PostgreSQL
- **Infrastructure**: Docker Compose

## Prerequisites
- Docker & Docker Compose
- Node.js (optional, for local dev without Docker)

## Getting Started

### Using Docker (Recommended)
1. **Build and Run**:
   ```bash
   docker-compose up --build
   ```
2. **Access the App**:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:4000](http://localhost:4000)

### Manual Setup (Local Development)

#### Backend
1. Navigate to `apps/backend`:
   ```bash
   cd apps/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (ensure you have a Postgres instance running or updated `DATABASE_URL`):
   ```bash
   npm start
   ```

#### Frontend
1. Navigate to `apps/frontend`:
   ```bash
   cd apps/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Features
- **Image Upload**: Upload jewellery images for analysis.
- **AI Analysis**: Mocked AI breakdown of design attributes.
- **Recommendations**: Get matched with Internal Inventory or Supplier Catalog items.
- **Quoting**: Add items to a cart and request a quote.
- **Internal Dashboard**: Sales/Sourcing teams can view and quote requests.

## Architecture
- `apps/frontend`: React application with Glassmorphism UI.
- `apps/backend`: Express API with PostgreSQL integration.
- `docker-compose.yml`: Orchestrates DB, Backend, and Frontend.
