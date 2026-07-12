# TransitOps: Smart Transport Operations Platform

TransitOps is a state-of-the-art **Smart Transport Operations Platform** designed to optimize fleet logistics, track trip status in real-time, monitor driver compliance, manage vehicle maintenance, and perform intelligent ROI analysis. 

The application is structured as a monorepo with a robust **FastAPI backend** and a premium, responsive **Next.js frontend**.

---

## 🚀 Key Features

*   **Intelligent Command Center**: Live dashboard showing real-time fleet metrics, active routes on an interactive map, and AI-powered Fleet Health Scores.
*   **Dynamic Visualizations**: Real-time charts showing **Fleet Utilization Trend** and **Weekly Fuel Cost Margins** aggregated directly from database logs.
*   **Fleet & Driver Registry**: Registration and management of vehicles (types, max load capacities, regions) and driver profiles (categories, licensing info).
*   **Compliance Document Verification**: Multi-role workflow where **Safety Officers** review and verify compliance documents (driving licenses, registrations, insurances) before dispatching.
*   **Workflow Operations**: Transition trips through lifecycle phases: `Draft` ➡️ `Dispatched` ➡️ `Completed`. Automatically updates vehicle odometer and records fuel logs.
*   **Preventative Maintenance**: Log maintenance schedules, lock vehicles in-shop during service, and record completion costs.
*   **Smart ROI & Fuel Analytics**: Deep analytical breakdown of vehicle ROI, fuel efficiency (`km/L`), and automatic CSV export.

---

## 🛠 Tech Stack

### Backend
*   **FastAPI**: High-performance Python web framework.
*   **SQLAlchemy**: Object-relational mapping (ORM) with async capabilities.
*   **MySQL & SQLite**: Relational database support (MySQL in production, SQLite fallback).
*   **JWT Authentication**: Secure stateless token-based authorization.
*   **SMTP Service**: Automated notifications for expiring compliance documents.

### Frontend
*   **Next.js 16 (Turbopack)**: React framework with modern app router.
*   **React 19 & TypeScript**: Type-safe component architecture.
*   **Leaflet & React Leaflet**: Interactive geospatial routing maps.
*   **Vanilla CSS**: High-performance customized component styles.

---

## 📁 Repository Structure

```text
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── models.py         # SQLAlchemy DB schemas (Trips, Vehicles, Users, etc.)
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── database.py       # Async engine & session setup
│   │   ├── auth.py           # Password hashes & JWT authentication
│   │   ├── routers/          # API Route controllers (auth, trips, reports, etc.)
│   │   └── utils/            # Background tasks, mailers, and database seeders
│   ├── requirements.txt      # Python dependencies
│   ├── test_workflow.py      # Automated integration and workflow test
│   └── .env                  # Configuration variables (DB connection, SMTP, JWT)
│
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/              # Next.js pages & app router routing
│   │   ├── components/       # Custom reusable UI components (Maps, Sparklines)
│   │   ├── context/          # User authentication and state provider
│   │   └── lib/              # API fetch wrappers and utility functions
│   ├── package.json          # Node dependencies and scripts
│   └── README.md             # Frontend specific setup instructions
```

---

## 🛠 Installation & Setup

### Prerequisites
*   [Python 3.12+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/)

---

### 1. Backend Configuration

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```

3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Configure environment variables in `.env`:
    ```ini
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=transitops
    JWT_SECRET=your_jwt_secret_key
    ```

5.  Start the FastAPI backend server:
    ```bash
    # Runs the server on http://127.0.0.1:8000
    python -m uvicorn app.main:app --reload
    ```

---

### 2. Frontend Configuration

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```

2.  Install npm packages:
    ```bash
    npm install
    ```

3.  Start the Next.js development server:
    ```bash
    # Runs on Windows PowerShell (CMD fallback)
    npm.cmd run dev
    # Or standard
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Workflow

We have provided a comprehensive workflow validation script to automatically test registrations, logins, compliance document uploads, safety validations, overweight trip blockages, trip state transitions, maintenance logging, and analytical reports:

```bash
cd backend
.\venv\Scripts\python.exe test_workflow.py
```

---

## 📊 Database Seeding

To seed historical logs (completed trips and fuel expenses) for the last week to make the dashboard utilization and cost charts display visual trends on start, run:
```bash
cd backend
.\venv\Scripts\python.exe -m app.utils.seed_historical
```
*(This seeder also triggers automatically during application startup if the database contains sparse trip records.)*
