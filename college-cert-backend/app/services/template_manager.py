import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

import boto3
from botocore.client import Config

from ..database import supabase

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
CACHE_DIR = "/tmp/template-images" if os.environ.get("VERCEL") else os.path.join(TEMPLATES_DIR, "cache")
TEMPLATES_TABLE = "certificate_templates"

DEFAULT_LAYOUT = {
    "name": {"x": 0.5, "y": 0.4, "font_size": 60, "align": "center", "color": "#000000"},
    "event": {"x": 0.5, "y": 0.5, "font_size": 40, "align": "center", "color": "#000000"},
    "date": {"x": 0.15, "y": 0.8, "font_size": 30, "align": "left", "color": "#000000"},
    "code": {"x": 0.85, "y": 0.9, "font_size": 30, "align": "right", "color": "#000000"},
    "qr": {"x": 0.08, "y": 0.7, "size": 0.18}
}

SUPABASE_PROJECT_ID = os.getenv("SUPABASE_URL", "").split("//")[1].split(".")[0] if os.getenv("SUPABASE_URL") else ""
S3_ENDPOINT = f"https://{SUPABASE_PROJECT_ID}.supabase.co/storage/v1/s3"
S3_ACCESS_KEY_ID = os.getenv("SUPABASE_S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.getenv("SUPABASE_S3_SECRET_ACCESS_KEY")
TEMPLATE_BUCKET = os.getenv("TEMPLATE_BUCKET_NAME", "template-certificates")


@lru_cache(maxsize=1)
def get_storage_client():
    if not (S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY):
        raise RuntimeError("Supabase S3 credentials are not configured")
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="ap-southeast-1",
    )


def _default_layout_copy() -> Dict[str, Any]:
    return json.loads(json.dumps(DEFAULT_LAYOUT))


def _parse_layout(raw: Any) -> Dict[str, Any]:
    if not raw:
        return _default_layout_copy()
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return _default_layout_copy()
    return json.loads(json.dumps(raw))


def _serialize_template(record: Dict[str, Any]) -> Dict[str, Any]:
    layout = _parse_layout(record.get("layout"))
    return {
        "id": record.get("id"),
        "name": record.get("name"),
        "file": record.get("storage_key"),
        "layout": layout,
        "image_url": record.get("image_url"),
    }


def list_templates() -> List[Dict[str, Any]]:
    res = supabase.table(TEMPLATES_TABLE).select("*").execute()
    records = res.data or []
    return [_serialize_template(rec) for rec in records]


def get_template(template_id: str) -> Dict[str, Any]:
    res = supabase.table(TEMPLATES_TABLE).select("*").eq("id", template_id).limit(1).execute()
    record = res.data[0] if res.data else None
    if not record:
        raise ValueError(f"Template '{template_id}' not found")
    return _serialize_template(record)


def add_template(template_id: str, name: str, filename: str, layout: Optional[Dict[str, Any]] = None, image_url: Optional[str] = None) -> Dict[str, Any]:
    # Ensure template does not already exist
    res = supabase.table(TEMPLATES_TABLE).select("id").eq("id", template_id).limit(1).execute()
    if res.data:
        raise ValueError(f"Template '{template_id}' already exists")

    layout_payload = _parse_layout(layout) if layout else _default_layout_copy()
    row = {
        "id": template_id,
        "name": name,
        "storage_key": filename,
        "image_url": image_url,
        "layout": layout_payload,
    }
    inserted = supabase.table(TEMPLATES_TABLE).insert(row).execute()
    record = inserted.data[0] if inserted.data else row
    return _serialize_template(record)


def update_template(template_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    existing = get_template(template_id)
    merged = existing.copy()

    if "name" in updates and updates["name"] is not None:
        merged["name"] = updates["name"]
    if "file" in updates and updates["file"] is not None:
        merged["file"] = updates["file"]
    if "image_url" in updates:
        merged["image_url"] = updates["image_url"]
    if "layout" in updates and updates["layout"] is not None:
        # Replace the entire layout instead of merging
        # This fixes the issue where removed fields persist
        merged["layout"] = updates["layout"]

    payload = {
        "name": merged["name"],
        "storage_key": merged.get("file"),
        "image_url": merged.get("image_url"),
        "layout": merged.get("layout", _default_layout_copy()),
    }

    # Debug logging to verify what's being saved
    print(f"[DEBUG] Updating template {template_id}")
    print(f"[DEBUG] Payload layout being saved: {json.dumps(payload['layout'], indent=2)}")
    
    result = supabase.table(TEMPLATES_TABLE).update(payload).eq("id", template_id).execute()
    print(f"[DEBUG] Update result data: {json.dumps(result.data, indent=2) if result.data else 'None'}")
    
    # Refetch from database to ensure we return exactly what was saved
    refetched = get_template(template_id)
    print(f"[DEBUG] Refetched layout: {json.dumps(refetched.get('layout'), indent=2)}")
    
    return refetched


def delete_template(template_id: str) -> Dict[str, Any]:
    template = get_template(template_id)
    supabase.table(TEMPLATES_TABLE).delete().eq("id", template_id).execute()
    return template


def merge_layout(template: Dict[str, Any], override: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    layout = json.loads(json.dumps(template.get("layout", {})))
    if not override:
        return layout
    for key, value in override.items():
        if value is None:
            continue
        layout[key] = {**layout.get(key, {}), **value}
    return layout


def _download_template_file(storage_key: Optional[str]) -> Optional[str]:
    if not storage_key:
        return None

    filename = os.path.basename(storage_key)
    os.makedirs(CACHE_DIR, exist_ok=True)
    local_path = os.path.join(CACHE_DIR, filename)

    if os.path.exists(local_path):
        return local_path

    try:
        s3 = get_storage_client()
        s3.download_file(TEMPLATE_BUCKET, storage_key, local_path)
        return local_path
    except RuntimeError as exc:
        print(f"Supabase Storage client is not configured: {exc}")
    except Exception as exc:
        print(f"Failed to download template from Supabase Storage: {exc}")
        if os.path.exists(local_path):
            os.remove(local_path)
    return None


def resolve_template_path(template: Dict[str, Any]) -> str:
    # Prefer downloading from Supabase Storage if storage key exists
    storage_key = template.get("file")
    downloaded = _download_template_file(storage_key)
    if downloaded and os.path.exists(downloaded):
        return downloaded

    # Fallback to legacy templates directory if available
    candidate = template.get("file", "certificate_template.png") or "certificate_template.png"
    if os.path.isabs(candidate) and os.path.exists(candidate):
        return candidate

    template_path = os.path.join(TEMPLATES_DIR, candidate)
    if os.path.exists(template_path):
        return template_path

    # Last resort: generate a placeholder template file
    placeholder = os.path.join(TEMPLATES_DIR, "default_placeholder.png")
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    if not os.path.exists(placeholder):
        from PIL import Image, ImageDraw

        img = Image.new("RGB", (1200, 800), color="white")
        draw = ImageDraw.Draw(img)
        draw.rectangle([(50, 50), (1150, 750)], outline="black", width=3)
        img.save(placeholder)
    return placeholder