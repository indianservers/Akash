# Akash

A production-quality web application that lets users browse, identify, name, and dedicate real stars using mobile browser sensors — similar to SkyMap or Sky Guide.

## Features

- **AR Sky View** — Point your phone at the sky. Real stars appear in correct positions using your GPS + compass + real RA/DEC data.
- **Real Astronomy** — Uses proper Julian Date, GMST, LST, Hour Angle, and Alt/Az conversion. All calculations are real — no fake star positions.
- **Star Naming** — Tap any star, submit a custom name and dedication. Admin reviews and approves.
- **Expiry System** — Every approved name has an expiry date (1 year, 5 years, or lifetime).
- **Star Types** — 20 star types (Main Sequence, Red Giant, Supergiant, etc.) shown across all views.
- **Public Registry** — Searchable public page of named stars with shareable links.
- **Admin Panel** — Approve/reject requests, manage expiry, process expired names in bulk.
- **PWA** — Installable on iOS and Android, works offline.
- **Mobile-first** — Full mobile browser support including iOS and Android sensor permissions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Three.js, Framer Motion |
| 3D Rendering | React Three Fiber, Three.js instanced rendering |
| State | Zustand |
| Backend | FastAPI (Python), SQLAlchemy ORM, Alembic |
| Database | MySQL 8.0 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Astronomy | Custom RA/DEC → Alt/Az engine in a Web Worker |
| PWA | next-pwa |
| Deployment | Docker, Docker Compose |

---

## Project Structure

```
NameMyStar/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth, stars, naming, admin, registry
│   │   ├── astronomy/          # RA/DEC → Alt/Az calculator
│   │   ├── core/               # config, database, security, deps
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # naming logic, audit logs
│   ├── alembic/                # DB migrations
│   ├── scripts/                # seed_admin.py, seed_stars.py, import_catalog_stars.py, seed_planets.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── ar/             # AR sky viewer
│   │   │   ├── stars/[id]/     # Star detail
│   │   │   ├── name-star/[id]/ # Star naming form
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── registry/       # Public registry search
│   │   │   ├── star/[slug]/    # Public share page
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── admin/requests/ # Admin naming requests
│   │   │   └── login/          # Authentication
│   │   ├── components/
│   │   │   ├── ar/             # ARViewer, StarField, ARCamera, etc.
│   │   │   └── ui/             # StarDetailPanel, PermissionFlow
│   │   ├── hooks/              # useDeviceOrientation, useGeolocation, useStarPositions
│   │   ├── lib/                # api.ts, store.ts, utils.ts
│   │   ├── workers/            # astronomy.worker.ts (Web Worker)
│   │   └── types/              # TypeScript types
│   └── public/
│       └── manifest.json       # PWA manifest
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Prerequisites
- Docker and Docker Compose
- OR: Node.js 20+, Python 3.11+, MySQL 8.0

### With Docker (Recommended)

```bash
# Clone and start everything
git clone <repo-url>
cd NameMyStar

# Copy and edit environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker-compose up --build -d

# The app will automatically:
# 1. Create the MySQL database
# 2. Run Alembic migrations
# 3. Create admin user
# 4. Seed real named stars (Sirius, Vega, Polaris, etc.)
# 5. Import the bundled 20,000-star HYG catalog into MySQL
#    Includes all bundled naked-eye stars; duplicate coordinates are skipped.
# 6. Seed real solar-system metadata for planets, Pluto, and the Moon

# Open the app
open http://localhost:4000
```

### Without Docker

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and SECRET_KEY

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed_admin.py
python scripts/seed_stars.py
python scripts/import_catalog_stars.py
python scripts/seed_planets.py

# Start server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL if needed

# Start dev server
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=mysql+pymysql://staruser:starpass@localhost:3306/star_registry
SECRET_KEY=change-this-to-a-random-64-char-secret-key
ALLOWED_ORIGINS=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456
DEBUG=false
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## API Documentation

With `DEBUG=true`, visit [http://localhost:8000/api/docs](http://localhost:8000/api/docs) for interactive Swagger UI.

### Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/stars/visible?lat=&lon=&max_magnitude=6.5
GET    /api/v1/stars/{star_id}
GET    /api/v1/stars/search?q=sirius

POST   /api/v1/stars/{star_id}/apply
GET    /api/v1/my/star-requests

GET    /api/v1/admin/star-requests
POST   /api/v1/admin/star-requests/{id}/approve
POST   /api/v1/admin/star-requests/{id}/reject
POST   /api/v1/admin/process-expired-names

GET    /api/v1/registry/search
GET    /api/v1/registry/{share_slug}
```

---

## Mobile Usage

1. Open the site on your Android or iPhone
2. Tap **Start AR Sky View**
3. Grant location and motion permissions when prompted
4. Point your phone toward the sky
5. Real stars appear aligned with the actual night sky
6. Tap any star to see details and name it

**iOS Note:** Motion permission requires a user tap due to Apple's API policy. The app handles this correctly with `DeviceOrientationEvent.requestPermission()`.

---

## Database Schema

### Key Tables
- **`stars`** — 36 columns including RA, DEC, magnitude, star type, custom name, registry status
- **`star_naming_requests`** — Full naming workflow with expiry, validity plan, certificate ID
- **`users`** — JWT auth with role-based access (User, Admin, SuperAdmin)
- **`audit_logs`** — Complete audit trail of admin actions

The database also includes `solar_system_objects` for real planet, dwarf planet, and Moon metadata used by runtime ephemeris rendering.

### Star Catalog

The first-run importer loads a bundled 20,000-star HYG catalog into MySQL. HYG combines Hipparcos, Yale Bright Star, and Gliese catalog data, including RA/Dec, apparent magnitude, spectral class, color index, distance, catalog IDs, and proper names when available.

The bundled catalog includes all naked-eye stars present in the generated Akash slice (`magnitude <= 6.5`) and then adds fainter real HYG stars until the database has at least 20,000 stars. Planets and the Moon are seeded into `solar_system_objects`; their live sky positions are computed at runtime because they move against the fixed star field.

---

## Rebuilding Star Catalog

To rebuild the bundled HYG catalog:

```bash
cd backend
python scripts/build_hyg_catalog.py
```

This downloads the HYG CSV and writes:

- `backend/app/data/stars_catalog.json` for database import
- `frontend/public/stars_catalog.json` for the AR renderer

---

## Production Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Railway / Render (Backend)
- Set `DATABASE_URL` to your managed MySQL instance.
- Set `SECRET_KEY` to a secure random value.
- Set `ALLOWED_ORIGINS` to your frontend domain.

### HTTPS Requirement
Device orientation and geolocation APIs require HTTPS in production. Use Vercel, Railway, or set up Let's Encrypt.

---

## Admin Workflow

1. Login at `/login` with admin credentials
2. Go to `/admin` for the dashboard
3. Go to `/admin/requests` to approve/reject pending requests
4. When approving: choose validity (1yr / 5yr / lifetime)
5. The star is immediately updated in the AR view
6. To process expired names: use the "Process Expired" button

---

## Certificate System

The database stores all fields needed for PDF certificate generation:
- Certificate ID (unique, e.g. `CERT-AB3K9FX2ZQ`)
- Star coordinates (RA/DEC)
- Recipient name, dedication type, message
- Approval date, expiry date
- QR code URL (pointing to the public share page)

PDF generation can be added using `reportlab` or `weasyprint` as a background task.

---

## Disclaimer

> Custom star names in Akash are ceremonial and recorded only in this private registry.
> They do not replace official astronomical names recognized by the International Astronomical Union.
