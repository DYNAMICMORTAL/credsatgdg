from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import events, participants, certificates
from .services import template_manager
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
 # Supabase manages tables via its dashboard. No need to create tables in code.

app = FastAPI(title="College Certificate Management API")

# CORS configuration
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://localhost:5173",
    "https://credsatgdg.vercel.app",  # Your production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["*"],
)

# Include routers
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(participants.router, prefix="/api/participants", tags=["participants"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])

# Serve static certificate files (only in local development, not on Vercel)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(BASE_DIR, "..", "certificates")
os.makedirs(CERT_DIR, exist_ok=True)
os.makedirs(template_manager.TEMPLATES_DIR, exist_ok=True)

# Don't mount static files on Vercel serverless
if not os.environ.get("VERCEL"):
    app.mount("/certificates", StaticFiles(directory=CERT_DIR), name="certificates")
    app.mount("/template-images", StaticFiles(directory=template_manager.TEMPLATES_DIR), name="template-images")

@app.get("/")
def root():
    return {
        "message": "College Certificate Management API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
