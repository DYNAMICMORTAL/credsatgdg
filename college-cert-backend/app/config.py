import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")
