import os
import random
import string
from PIL import Image, ImageDraw, ImageFont
import qrcode
from dotenv import load_dotenv
from ..database import supabase
import boto3
from botocore.client import Config

from . import template_manager

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "certificate_template.png")
FONT_PATH = os.path.join(BASE_DIR, "fonts", "Roboto-Bold.ttf")

# Use /tmp for writable directory (Vercel serverless compatible)
CERT_DIR = "/tmp/certificates" if os.environ.get("VERCEL") else os.path.join(BASE_DIR, "..", "certificates")

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
VERIFICATION_URL_TEMPLATE = os.getenv("VERIFICATION_URL_TEMPLATE")
VERIFICATION_BASE_URL = os.getenv("VERIFICATION_BASE_URL")

# Supabase S3 configuration
SUPABASE_PROJECT_ID = os.getenv("SUPABASE_URL", "").split("//")[1].split(".")[0] if os.getenv("SUPABASE_URL") else ""
S3_ENDPOINT = f"https://{SUPABASE_PROJECT_ID}.supabase.co/storage/v1/s3"
S3_ACCESS_KEY_ID = os.getenv("SUPABASE_S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.getenv("SUPABASE_S3_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = "certificates"

os.makedirs(CERT_DIR, exist_ok=True)

def generate_code(prefix: str = "APSIT") -> str:
    """Generate unique certificate code"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"

def _ensure_template_file(path: str) -> str:
    """Ensure template file exists, use /tmp for Vercel serverless"""
    if os.path.exists(path):
        return path
    
    # For Vercel, create in /tmp instead
    if os.environ.get("VERCEL"):
        tmp_template = "/tmp/certificate_template.png"
        if os.path.exists(tmp_template):
            return tmp_template
        path = tmp_template
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    template = Image.new('RGB', (1200, 800), color='white')
    draw = ImageDraw.Draw(template)
    draw.rectangle([(50, 50), (1150, 750)], outline='black', width=3)
    draw.rectangle([(60, 60), (1140, 740)], outline='black', width=1)
    try:
        title_font = ImageFont.truetype("arial.ttf", 50)
    except Exception:
        title_font = ImageFont.load_default()
    title_text = "CERTIFICATE OF PARTICIPATION"
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((1200 - title_w) / 2, 150), title_text, font=title_font, fill="black")
    template.save(path)
    return path


def _resolve_coordinate(value: float, dimension: int) -> int:
    if 0 <= value <= 1:
        return int(value * dimension)
    return int(value)


def _resolve_size(value: float, dimension: int) -> int:
    if 0 < value <= 1:
        return int(value * dimension)
    return int(value)


def _load_font(size: int, font_family: str = None) -> ImageFont.FreeTypeFont:
    """Load font with specified size and optional font family"""
    
    # Map of font family names to system font files
    font_map = {
        "Arial": ["arial.ttf", "Arial.ttf", "ArialMT.ttf"],
        "Times New Roman": ["times.ttf", "Times.ttf", "TimesNewRoman.ttf"],
        "Georgia": ["georgia.ttf", "Georgia.ttf"],
        "Palatino": ["palatino.ttf", "Palatino.ttf", "pala.ttf"],
        "Garamond": ["garamond.ttf", "Garamond.ttf", "gara.ttf"],
        "Bookman": ["bookman.ttf", "Bookman.ttf"],
        "Courier New": ["cour.ttf", "Courier.ttf", "CourierNew.ttf"],
        "Verdana": ["verdana.ttf", "Verdana.ttf"],
        "Helvetica": ["helvetica.ttf", "Helvetica.ttf"],
        "Tahoma": ["tahoma.ttf", "Tahoma.ttf"]
    }
    
    # Try custom font family if specified
    if font_family and font_family in font_map:
        for font_file in font_map[font_family]:
            try:
                return ImageFont.truetype(font_file, size)
            except Exception:
                continue
    
    # Fallback to default Roboto font
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except Exception:
        pass
    
    # Try Arial as another fallback
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        pass
    
    # Last resort: default font
    return ImageFont.load_default()


def _draw_text(draw: ImageDraw.ImageDraw, text: str, placement: dict, canvas_w: int, canvas_h: int) -> None:
    font_size = placement.get("font_size") or 40
    font_family = placement.get("font_family")
    font = _load_font(font_size, font_family)
    x = _resolve_coordinate(placement.get("x", 0.5), canvas_w)
    y = _resolve_coordinate(placement.get("y", 0.5), canvas_h)
    align = placement.get("align", "center")
    color = placement.get("color", "#000000")
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    if align == "center":
        x -= text_w // 2
    elif align == "right":
        x -= text_w
    y -= text_h // 2
    draw.text((x, y), text, font=font, fill=color)


def _build_verify_url(code: str) -> str:
    if VERIFICATION_URL_TEMPLATE and "{code}" in VERIFICATION_URL_TEMPLATE:
        return VERIFICATION_URL_TEMPLATE.replace("{code}", code)
    if VERIFICATION_BASE_URL:
        base = VERIFICATION_BASE_URL.rstrip("/")
        return f"{base}/{code}"
    fallback = FRONTEND_URL.rstrip("/")
    if fallback.endswith("/verify"):
        return f"{fallback}/{code}"
    return f"{fallback}/verify/{code}"


def generate_certificate_image(
    participant_name: str,
    event_name: str,
    event_date: str,
    code: str,
    template: dict,
    layout: dict,
    participant_data: dict = None,
):
    """Generate certificate image with support for custom fields from participant data"""
    template_path = template_manager.resolve_template_path(template)
    if not os.path.exists(template_path):
        template_path = _ensure_template_file(DEFAULT_TEMPLATE_PATH)

    base = Image.open(template_path).convert("RGBA")
    draw = ImageDraw.Draw(base)
    w, h = base.size

    # Standard fields
    name_cfg = layout.get("name", {})
    if name_cfg:
        _draw_text(draw, participant_name, name_cfg, w, h)

    event_cfg = layout.get("event", {})
    if event_cfg:
        _draw_text(draw, event_name, event_cfg, w, h)

    date_cfg = layout.get("date", {})
    if date_cfg:
        date_text = f"Issued on: {event_date}"
        _draw_text(draw, date_text, date_cfg, w, h)

    code_cfg = layout.get("code", {})
    if code_cfg:
        code_text = f"Code: {code}"
        _draw_text(draw, code_text, code_cfg, w, h)

    # Handle custom fields from participant data
    if participant_data:
        for field_key, field_cfg in layout.items():
            # Skip standard fields and qr
            if field_key in ["name", "event", "date", "code", "qr"]:
                continue
            
            # Check if this field exists in participant data
            if isinstance(field_cfg, dict) and field_key in participant_data:
                field_value = participant_data.get(field_key)
                if field_value:
                    _draw_text(draw, str(field_value), field_cfg, w, h)

    # QR Code
    qr_cfg = layout.get("qr", {})
    if qr_cfg:
        verify_url = _build_verify_url(code)
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(verify_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
        qr_size = _resolve_size(qr_cfg.get("size", 0.15), min(w, h))
        qr_img = qr_img.resize((qr_size, qr_size))
        qr_x = _resolve_coordinate(qr_cfg.get("x", 0.08), w)
        qr_y = _resolve_coordinate(qr_cfg.get("y", 0.7), h)
        base.paste(qr_img, (qr_x, qr_y), qr_img)

    filename = f"{code}.png"
    filepath = os.path.join(CERT_DIR, filename)
    base.save(filepath)

    # Upload to Supabase Storage using S3 API
    try:
        # Initialize S3 client with Supabase credentials
        s3_client = boto3.client(
            's3',
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY_ID,
            aws_secret_access_key=S3_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='ap-southeast-1'
        )
        
        # Upload file
        with open(filepath, 'rb') as f:
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=filename,
                Body=f.read(),
                ContentType='image/png'
            )
        
        # Get public URL
        public_url = supabase.storage.from_(S3_BUCKET_NAME).get_public_url(filename)
        
        # Clean up local file
        if os.path.exists(filepath):
            os.remove(filepath)
        
        return public_url
    except Exception as e:
        # Fallback to local path if upload fails
        print(f"Supabase S3 upload failed: {e}")
        return f"certificates/{filename}"
