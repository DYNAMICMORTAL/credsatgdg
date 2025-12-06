# College Certificate Management System - Frontend

React + Vite frontend for the college certificate management system.

## Features

- 🎨 Modern, responsive UI
- 📋 Event management dashboard
- 📤 CSV upload for participants
- 🎫 Certificate generation
- ✅ Public certificate verification
- 📱 Mobile-friendly design

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ADMIN_SECRET=your-admin-password
```

3. **Run development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build for Production

```bash
npm run build
```

The `dist` folder will contain production-ready files.

## Pages

- `/` - Landing page
- `/admin/events` - Events management
- `/admin/events/:id` - Event details & certificate generation
- `/verify/:code` - Public certificate verification

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on Vercel
3. Add environment variables:
   - `VITE_API_BASE_URL` - Your backend URL
   - `VITE_ADMIN_SECRET` - Admin password
4. Deploy

### Netlify

1. Push to GitHub
2. New site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

## Tech Stack

- React 18
- Vite 5
- React Router DOM
- Axios
- CSS3

## License

MIT
