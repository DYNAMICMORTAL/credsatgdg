import json
import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from .. import schemas
from ..database import supabase
from ..services.certificate_generator import generate_certificate_image, generate_code
from ..services import template_manager

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")

def verify_admin(secret: str):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/templates/upload", response_model=schemas.CertificateTemplate)
async def upload_template(
    admin_secret: str = Form(...),
    template_id: str = Form(...),
    name: str = Form(...),
    layout: str | None = Form(None),
    image: UploadFile = File(...),
):
    verify_admin(admin_secret)
    allowed_types = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
    }
    suffix = allowed_types.get(image.content_type or "")
    if not suffix:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    raw_id = template_id.strip()
    if not raw_id:
        raise HTTPException(status_code=400, detail="Template ID cannot be empty")
    safe_id = "".join(ch if (ch.isalnum() or ch in {"-", "_"}) else "-" for ch in raw_id)
    safe_id = safe_id.strip("-_")
    if not safe_id:
        raise HTTPException(status_code=400, detail="Template ID must contain alphanumeric characters")
    os.makedirs(template_manager.TEMPLATES_DIR, exist_ok=True)
    filename = f"{safe_id}{suffix}"
    filepath = os.path.join(template_manager.TEMPLATES_DIR, filename)
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    with open(filepath, "wb") as handle:
        handle.write(content)
    layout_payload = None
    if layout:
        try:
            layout_payload = json.loads(layout)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid layout JSON: {exc}") from exc
    try:
        return template_manager.add_template(safe_id, name, filename, layout_payload)
    except ValueError as exc:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/templates", response_model=list[schemas.CertificateTemplate])
def list_templates():
    return template_manager.list_templates()


@router.put("/templates/{template_id}", response_model=schemas.CertificateTemplate)
def update_template(template_id: str, payload: schemas.TemplateUpdateRequest, admin_secret: str):
    verify_admin(admin_secret)
    try:
        updated = template_manager.update_template(template_id, payload.dict(exclude_unset=True, exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return updated


@router.post("/generate_for_event/{event_id}")
def generate_certificates_for_event(
    event_id: int,
    payload: schemas.CertificateGenerationRequest,
    admin_secret: str,
):
    verify_admin(admin_secret)
    try:
        template = template_manager.get_template(payload.template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    override = payload.layout_override.dict(exclude_unset=True, exclude_none=True) if payload.layout_override else None
    layout = template_manager.merge_layout(template, override)
    try:
        event_res = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    event_row = event_res.data[0] if event_res.data else None
    if not event_row:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        participants = supabase.table("participants").select("*").eq("event_id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    if not participants.data:
        raise HTTPException(status_code=400, detail="No participants for this event")
    created = 0
    for participant in participants.data:
        try:
            existing = (
                supabase.table("certificates")
                .select("*")
                .eq("event_id", event_id)
                .eq("participant_id", participant["id"])
                .limit(1)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
        if existing.data:
            continue
        code = generate_code(prefix="APSIT")
        cert_path = generate_certificate_image(
            participant_name=participant["name"],
            event_name=event_row["name"],
            event_date=event_row["date"],
            code=code,
            template=template,
            layout=layout,
            participant_data=participant,  # Pass full participant data for custom fields
        )
        cert_data = {
            "event_id": event_id,
            "participant_id": participant["id"],
            "certificate_code": code,
            "certificate_path": cert_path,
            "status": "valid"
        }
        supabase.table("certificates").insert(cert_data).execute()
        created += 1
    return {"message": f"Generated {created} certificates"}

@router.get("/by_event/{event_id}", response_model=list[schemas.Certificate])
def list_certificates_for_event(event_id: int, admin_secret: str):
    verify_admin(admin_secret)
    try:
        res = supabase.table("certificates").select("*").eq("event_id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    return res.data

@router.get("/verify/{code}", response_model=schemas.VerificationResponse)
def verify_certificate(code: str):
    try:
        cert = supabase.table("certificates").select("*").eq("certificate_code", code).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    cert_row = cert.data[0] if cert.data else None
    if not cert_row:
        return schemas.VerificationResponse(
            status="invalid",
            message="Certificate not found"
        )
    if cert_row["status"] == "revoked":
        return schemas.VerificationResponse(
            status="revoked",
            message="Certificate has been revoked by issuer",
            certificate_code=cert_row["certificate_code"]
        )
    try:
        participant = supabase.table("participants").select("*").eq("id", cert_row["participant_id"]).limit(1).execute()
        event = supabase.table("events").select("*").eq("id", cert_row["event_id"]).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    participant_row = participant.data[0] if participant.data else None
    event_row = event.data[0] if event.data else None
    return schemas.VerificationResponse(
        status="valid",
        message="Certificate is valid",
        name=participant_row["name"] if participant_row else None,
        event_name=event_row["name"] if event_row else None,
        event_date=event_row["date"] if event_row else None,
        issued_at=cert_row.get("issued_at"),
        certificate_code=cert_row["certificate_code"]
    )

@router.patch("/{certificate_id}/revoke")
def revoke_certificate(certificate_id: int, admin_secret: str):
    verify_admin(admin_secret)
    try:
        cert = supabase.table("certificates").select("*").eq("id", certificate_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    cert_row = cert.data[0] if cert.data else None
    if not cert_row:
        raise HTTPException(status_code=404, detail="Certificate not found")
    try:
        supabase.table("certificates").update({"status": "revoked"}).eq("id", certificate_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase update failed: {exc}") from exc
    return {"message": "Certificate revoked"}
