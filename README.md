# 🎓 College Certificate Management System

Complete solution for generating, managing, and verifying digital certificates with QR codes.

## Architecture

- **Frontend**: React + Vite (Vercel deployment)
- **Backend**: FastAPI (Render/Railway deployment)
- **Database**: Supabase (managed serverless Postgres)
- **Storage**: Local filesystem (certificates folder)

## Quick Start

### 1. Backend Setup

```bash
cd college-cert-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `college-cert-backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:8000
ADMIN_SECRET=your-strong-password
```

**How to get Supabase credentials:**
1. Go to [Supabase](https://supabase.com) and create a project.
2. In your project dashboard, go to **Project Settings > API**.
3. Copy the `Project URL` and `anon public` key into your `.env` as shown above.
4. (Optional) For direct SQL access, use the `Connection string` from **Project Settings > Database** as `SUPABASE_DB_URL`.

**Get Supabase Database URL:**
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy Connection String (URI mode)
5. Replace `[YOUR-PASSWORD]` with your database password

```bash
# Run backend
uvicorn app.main:app --reload --port 8000
```

Backend will run at: http://localhost:8000

### 2. Frontend Setup

```bash
cd college-cert-frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `college-cert-frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ADMIN_SECRET=your-strong-password
```

```bash
# Run frontend
npm run dev
```

Frontend will run at: http://localhost:5173

## Usage Flow

### Admin Workflow

1. **Create Event**
   - Go to http://localhost:5173/admin/events
   - Fill event details (name, date, description)
   - Click "Create Event"

2. **Upload Participants**
   - Click on an event → "Manage"
   - Upload CSV file with format:
     ```csv
     name,email,roll_no,department
     Mihir Amin,mihir@example.com,20CO123,Computer
     ```

3. **Generate Certificates**
   - Click "Generate Certificates"
   - System will create PNG certificates with QR codes
   - Download links appear in table

### Public Verification

1. **Via QR Code**
   - Scan QR code on certificate
   - Opens verification page automatically

2. **Via URL**
   - Visit: http://localhost:5173/verify/CERTIFICATE-CODE
   - Shows certificate validity and details

## Project Structure

```
verify/
├── college-cert-backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── events.py
│   │   │   ├── participants.py
│   │   │   └── certificates.py
│   │   ├── services/
│   │   │   └── certificate_generator.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── certificates/          # Generated certificate images
│   ├── requirements.txt
│   └── .env
│
├── college-cert-frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── EventsList.jsx
│   │   │   ├── EventDetail.jsx
│   │   │   └── VerifyPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── api.js
│   ├── package.json
│   └── .env
│
└── sample-participants.csv
```

## API Endpoints

### Events
- `POST /api/events/` - Create event
- `GET /api/events/` - List events
- `GET /api/events/{id}` - Get event

### Participants
- `POST /api/participants/upload_csv` - Upload participants CSV
- `GET /api/participants/by_event/{event_id}` - List participants

### Certificates
- `POST /api/certificates/generate_for_event/{event_id}` - Generate certificates
- `GET /api/certificates/by_event/{event_id}` - List certificates
- `GET /api/certificates/verify/{code}` - Verify certificate (PUBLIC)

## Database Schema

### Events
- id, name, description, date, is_active

### Participants
- id, event_id, name, email, roll_no, department

### Certificates
- id, event_id, participant_id, certificate_code, certificate_path, status, issued_at

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Environment Variables:
   - `DATABASE_URL` - Supabase PostgreSQL URL
   - `FRONTEND_URL` - Your Vercel URL
   - `BASE_URL` - Your Render URL
   - `ADMIN_SECRET` - Strong password
   - `PYTHON_VERSION` - 3.11.0

### Frontend (Vercel)

1. Push code to GitHub
2. Import project on Vercel
3. Settings:
   - **Framework**: Vite
   - **Root Directory**: `college-cert-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL` - Your Render backend URL
   - `VITE_ADMIN_SECRET` - Same as backend

### Database (Supabase)

Already configured! Just use the connection string from Supabase dashboard.

## Security Notes

- ✅ Admin routes protected with `admin_secret` parameter
- ✅ CORS configured for frontend domain
- ✅ Certificate verification is public (no auth needed)
- ⚠️ For production: Replace admin_secret with proper JWT authentication

## Customization

### Certificate Template

Edit `college-cert-backend/app/services/certificate_generator.py`:
- Change template size
- Modify text positions
- Adjust fonts and colors
- Add logos or images

### Frontend Styling

Edit `college-cert-frontend/src/index.css`:
- Change color scheme
- Modify layout
- Update fonts

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is accessible
- Verify Python version >= 3.9

### Frontend build fails
- Run `npm install` again
- Check Node version >= 16
- Clear `node_modules` and reinstall

### Certificates not generating
- Check font file exists or use system fonts
- Ensure `certificates/` folder has write permissions
- Verify Pillow is installed correctly

### CORS errors
- Update FRONTEND_URL in backend .env
- Check CORS middleware in `app/main.py`

## License

MIT

## Support

For issues, create a GitHub issue or contact support.

---

**Built with ❤️ for educational institutions**
