# FAS Fellowship Website

Faith Alone Saves (FAS) — dynamic fellowship website starter.

## Stack
- Frontend: React + Vite
- Backend: Django + Django REST Framework
- Database: SQLite for development
- Admin: Django Admin
- Branding: official FAS logo supplied by the team

## Current design direction
White-first, professional, spacious UI using:
- White / Ivory surfaces
- Deep forest green
- FAS gold
- Charcoal text
- Subtle gray borders

## Dynamic content
The Django admin can manage:
- Homepage settings
- Upcoming / past events
- Gallery images
- Student testimonies
- Contact/support messages

## Run locally

### Backend
```powershell
cd backend
python -m venv venv
.env\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin:
http://127.0.0.1:8000/admin/

API:
http://127.0.0.1:8000/api/

### Frontend
Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:
http://localhost:5173/

## Important
The official FAS logo is stored at:
`frontend/public/branding/fas-logo.png`

Replace contact/social links and event content from Django Admin rather than hard-coding them in the React UI.
