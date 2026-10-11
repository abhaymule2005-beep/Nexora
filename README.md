# Nexora — AI Travel Planning & Dynamic Replanning System

Nexora is an intelligent, personalized travel planning and dynamic minimal-change replanning system. It bridges free-form natural language requirements with mathematical constraint programming (Google OR-Tools), geodesic route optimization (2-opt TSP), real-time weather risk evaluation (Open-Meteo), and minimal-change replanning under real-world disruptions.

---

## 🌟 Core Product Flow

```text
UNDERSTAND   → Natural-Language Requirement Extraction & Traveler Profiler
RECOMMEND    → Hybrid Content-Based & Semantic Embedding Ranker
OPTIMIZE     → Google OR-Tools CP-SAT Schedule & 2-Opt Route Minimizer
VALIDATE     → Multi-Constraint Checker (Overlaps, Hours, Pace, Budget, Weather)
REPLAN       → Dynamic Minimal-Change Replanner (Freezes Unaffected Days)
```

---

## 🚀 Key Features

1. **Natural Language Understanding**: Parses unstructured requests (e.g., *"5 days in Goa with parents, ₹40,000 budget, relaxed, beaches and history"*) into validated Pydantic models. Includes OpenAI-compatible LLM support with a 100% offline regex & heuristic fallback.
2. **Zero Paid Dependency Guarantee**: Works completely out-of-the-box without requiring paid API keys:
   - Built-in SQLite database seeded with 32 authentic Goa attractions across 8 categories.
   - Open-Meteo API for real-time 7-day weather forecasts without keys.
   - Leaflet + OpenStreetMap for interactive interactive route mapping.
   - Haversine geodesic distance matrix with 2-opt routing fallback.
3. **Google OR-Tools Constraint Scheduling**: Strict enforcement of time windows, opening and closing hours, lunch breaks, and pacing. Zero overlapping activities.
4. **2-Opt Route Optimization**: Re-orders sequential daily activities to minimize backtracking and transit kilometers.
5. **Multi-Constraint Validator**: Independent verification of budget, operating hours, schedule clashes, travel buffers, and weather risk.
6. **Dynamic Minimal-Change Replanning**: When weather changes (e.g. Day 2 heavy rain on Baga Beach) or budgets drop, it replaces only the affected activity with an optimal substitute while **freezing all unaffected days and activities intact**.
7. **What-If Simulation**: Test disruption scenarios before applying changes.
8. **Research Evaluation Benchmarks**: Measures Precision@K, Recall@K, NDCG@K, route reduction percentage, and comparisons against Baseline A (Greedy) and Baseline B (Pure Rec).

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic, SQLAlchemy, SQLite, Google OR-Tools, Scikit-Learn, Pandas, NumPy, Requests, HTTPX, Pytest.
- **Frontend**: React, Vite, TypeScript, Leaflet, React-Leaflet, Lucide Icons.
- **Weather**: Open-Meteo.
- **Maps**: OpenStreetMap with Leaflet.

---

## 💻 Quick Start & Running Locally

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (initializes database and seeds data automatically)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API Docs available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend UI available at: `http://127.0.0.1:5173/`

### 3. Running Automated Tests

```bash
cd backend
pytest -v
```

---

## 🧪 Demo Scenarios

### Demo 1 — Normal Planning
1. Open `http://127.0.0.1:5173`
2. Click **🏖️ Demo 1: Goa 5-Day (Family Relaxed)**
3. Click **Generate Optimized Itinerary**
4. Inspect the timeline with opening hours, why-chosen badges, Leaflet map with 2-opt route lines, and feasibility score.

### Demo 2 — Weather Disruption & Dynamic Replanning
1. On the generated itinerary, click **⚡ Simulate Disruption / Replan**
2. Select **Weather Disruption** on Day 2 (Simulating heavy rain)
3. Click **Run What-If Simulation**
4. Observe that Baga Beach is replaced by an indoor museum, while Days 1, 3, 4, and 5 remain untouched.
5. Click **Apply Minimal-Change Replan** to update the dashboard live.

### Demo 3 — Research Evaluation Benchmarks
1. Click **Research Benchmark** in the top navigation bar.
2. View live metrics: Precision@5, NDCG@5, 2-Opt Route Savings, Schedule Feasibility (100%), and the baseline comparison table.

---

## 🐳 Docker Deployment

Run both frontend and backend using Docker Compose:

```bash
docker compose up --build
```
