# Quiz Management & Online Assessment Platform

A full-stack online quiz management and assessment platform built with Python (Flask, SQLAlchemy, PostgreSQL/SQLite, JWT) and React (Vite, React Router, Axios).

## Features

### Authentication & Role-Based Access Control
- Secure JWT-based authentication
- Password hashing with bcrypt/pbkdf2
- Role separation: **ADMIN** and **STUDENT**
- Active/Inactive account status enforcement

### Admin Dashboard & Management
- User management (view, update roles, manage user statuses)
- Category management (CRUD operations on quiz categories)
- Quiz management (Create, edit, publish/unpublish quizzes)
- Question management (Create, update, delete MCQ questions and 4 options)

### Student Quiz Experience
- Browse published quizzes
- Quiz metadata preview (duration, questions count, passing score, difficulty)
- Real-time countdown timer synchronized with server `expires_at` timestamp
- Interactive question navigation & option selection
- State persistence across page refresh
- Auto-timeout on timer expiration

---

## Tech Stack

### Backend
- **Framework**: Flask
- **Database**: PostgreSQL / SQLite (via SQLAlchemy ORM)
- **Authentication**: Flask-JWT-Extended
- **Testing**: pytest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate virtual environment and install dependencies:
   ```bash
   ..\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run database migrations / seed data:
   ```bash
   flask seed-data
   ```
4. Run the Flask development server:
   ```bash
   flask run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## Running Tests

To execute the backend automated test suite:
```bash
cd backend
python -m pytest
```
