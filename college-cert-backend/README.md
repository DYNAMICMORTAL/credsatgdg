# College Certificate Management System - Backend

FastAPI backend for generating and managing college certificates with QR code verification.

## Features

- 🎓 Create and manage events
- 👥 Upload participants via CSV
- 🎫 Generate certificates with QR codes
- ✅ Verify certificates
- 🔒 Admin authentication
- 🟢 Supabase database (managed serverless Postgres)

## Setup

1. **Create virtual environment**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:8000
ADMIN_SECRET=your-secure-password
```

**How to get Supabase credentials:**
1. Go to [Supabase](https://supabase.com) and create a project.
2. In your project dashboard, go to **Project Settings > API**.
3. Copy the `Project URL` and `anon public` key into your `.env` as shown above.

**Create tables in Supabase:**
Use the Supabase dashboard's Table Editor or SQL Editor to create the following tables:
	- `events`
	- `participants`
	- `certificates`

See the `init_db.py` file for a list of required tables. No need to run it; it's just a reference.

4. **Run the server**
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Events
- `POST /api/events/` - Create event
- `GET /api/events/` - List all events
- `GET /api/events/{id}` - Get event details

### Participants
- `POST /api/participants/` - Add participant
- `POST /api/participants/upload_csv` - Upload CSV
- `GET /api/participants/by_event/{event_id}` - List participants

### Certificates
- `POST /api/certificates/generate_for_event/{event_id}` - Generate certificates
- `GET /api/certificates/by_event/{event_id}` - List certificates
- `GET /api/certificates/verify/{code}` - Verify certificate

## CSV Format

```csv
name,email,roll_no,department
Mihir Amin,mihir@example.com,20CO123,Computer
```

## Deployment

### Render
1. Create new Web Service
2. Connect repository
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Add environment variables

### Railway
1. Deploy from GitHub
2. Add Postgres addon
3. Set environment variables

## License

MIT
