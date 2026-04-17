# J & J Infra

Full-stack MERN app for an interior design / infrastructure business.

- **Frontend** — React + Vite + Tailwind (`frontend/`)
- **Backend** — Node.js + Express + MongoDB (`backend/`)
- **Infra** — Docker Compose for local, Kubernetes manifests under `k8s/`, Jenkins pipeline in `Jenkinsfile`

## Local development

```bash
# Backend
cd backend
cp .env.example .env       # then fill in values
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Docker

```bash
docker compose up --build
```

## Free cloud deployment

See [**DEPLOYMENT.md**](./DEPLOYMENT.md) for a step-by-step guide to deploying this app **completely free** on Render + MongoDB Atlas.
