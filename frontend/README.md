# TransitOps Starter App

Welcome to **TransitOps**, a smart transport operations platform designed to optimize fleet operations, vehicle management, and driver assignments. 

This repository contains the initial starter templates for both the FastAPI backend and Next.js frontend.

## Project Structure

```text
Commit/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── routers/          # API endpoint routes
│   │   ├── main.py           # Application entrypoint
│   │   ├── database.py       # SQLAlchemy database connection
│   │   ├── models.py         # SQLAlchemy Database models
│   │   └── schemas.py        # Pydantic validation schemas
│   ├── requirements.txt      # Python package requirements
│   └── .env.example          # Sample environment variables config
└── frontend/                 # Next.js frontend
    ├── src/
    │   └── app/              # Next.js App Router (pages and layouts)
    ├── package.json          # Node dependencies
    └── tsconfig.json         # TypeScript configuration
```

## Running the Application

### 1. Backend (FastAPI)
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will run on `http://127.0.0.1:8000`. You can visit Swagger docs at `/docs`.

### 2. Frontend (Next.js)
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install node packages:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The web UI will be accessible at `http://localhost:3000`.
