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


def _collect_origins(*values: str | None) -> set[str]:
    collected: set[str] = set()
    for value in values:
        if not value:
            continue
        normalized = value.replace("\n", ",").replace(" ", ",")
        for origin in normalized.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                collected.add(cleaned)
    return collected


# CORS configuration
frontends: set[str] = set()
frontends.update(_collect_origins(os.getenv("FRONTEND_URL")))
frontends.update(_collect_origins(os.getenv("FRONTEND_URLS")))
frontends.update(_collect_origins(os.getenv("ADDITIONAL_CORS_ORIGINS")))

# Always include local dev and the deployed dashboard
frontends.add("http://localhost:5173")
frontends.add("http://127.0.0.1:5173")
frontends.add("https://credsatgdg.vercel.app")
frontends.add("https://credsatgdbg.vercel.app")

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
    cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX")
    if not cors_origin_regex and os.getenv("ENABLE_VERCEL_WILDCARD", "true").lower() == "true":
        cors_origin_regex = r"https://.*\.vercel\.app"
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
