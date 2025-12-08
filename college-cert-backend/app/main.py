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
frontends: set[str] = set()
default_frontend = os.getenv("FRONTEND_URL", "http://localhost:5173").strip()
if default_frontend:
    frontends.add(default_frontend.rstrip("/"))
frontends.add("http://localhost:5173")
frontends.add("https://credsatgdg.vercel.app")

additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
for origin in additional_origins.split(","):
    cleaned = origin.strip().rstrip("/")
    if cleaned:
        frontends.add(cleaned)

allow_all_origins = os.getenv("ALLOW_ALL_CORS", "false").lower() == "true"
allow_credentials = os.getenv("ALLOW_CREDENTIALS", "true").lower() == "true"

cors_kwargs = {
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["*"],
}

if allow_all_origins:
    # Browsers reject Access-Control-Allow-Origin "*" when credentials are included
    cors_kwargs.update({
        "allow_origins": ["*"],
        "allow_credentials": False,
    })
else:
    allowed_list = sorted(frontends) or ["http://localhost:5173"]
    cors_kwargs.update({
        "allow_origins": allowed_list,
        "allow_credentials": allow_credentials,
    })
    cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")
    if cors_origin_regex:
        cors_kwargs["allow_origin_regex"] = cors_origin_regex

app.add_middleware(CORSMiddleware, **cors_kwargs)

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
