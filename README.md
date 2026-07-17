# Personal Finance Tracker

A premium full-stack Personal Finance Tracker developed with Python Django REST Framework (DRF) and React.js. It features secure JWT authentication, dynamic transaction logging, category-based monthly budgets with real-time utilization warnings, rich interactive charts, and downloadable reports in PDF, CSV, and Excel formats.

## Features

1. **JWT Authentication**: Register, Login, Logout, and secure token refresh functionality.
2. **Dashboard**: Live Net Savings, Income/Expense cards, interactive monthly trend charts (Area Chart), and category breakdowns (Donut Chart).
3. **Transaction Management**: Complete CRUD operations for adding, editing, deleting, and listing financial transactions.
4. **Budget Tracker**: Set monthly limits per category and track progress. Dynamic warnings alert the user when approaching (80%+) or exceeding limits.
5. **Analytics & Reports**: Clean reports preview with direct export to:
   - **PDF** (rendered via reportlab)
   - **CSV** (rendered via pandas)
   - **Excel** (rendered via openpyxl)

## Tech Stack

- **Frontend**: React, Material-UI (MUI), Recharts, Axios, React Router.
- **Backend**: Python 3.x, Django, Django REST Framework, Django REST Framework SimpleJWT.
- **Database**: SQLite (default) / PostgreSQL support ready.

## Running Locally

### Backend Setup

1. From the project root, activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
2. Install packages:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run migrations and start the server:
   ```bash
   python backend/manage.py migrate
   python backend/manage.py runserver
   ```
   The backend will run on `http://127.0.0.1:8000/`.

### Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install packages and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   The frontend will run on `http://localhost:5173/`.
