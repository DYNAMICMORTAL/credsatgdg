import json
import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from .. import schemas
from ..database import supabase
from ..services.certificate_generator import (
    generate_certificate_image,
    generate_certificate_preview_pdf,
    generate_code,
)
from ..services import template_manager

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")

TEMPLATE_BUCKET = os.getenv("TEMPLATE_BUCKET_NAME", "template-certificates")

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
    
    filename = f"{safe_id}{suffix}"
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    # Save to /tmp directory (writable on Vercel)
    os.makedirs("/tmp/templates", exist_ok=True)
    tmp_filepath = os.path.join("/tmp/templates", filename)
    with open(tmp_filepath, "wb") as handle:
        handle.write(content)
    
    # Upload template image to Supabase Storage
    template_image_url = None
    try:
        s3_client = template_manager.get_storage_client()
        s3_client.put_object(
            Bucket=TEMPLATE_BUCKET,
            Key=filename,
            Body=content,
            ContentType=image.content_type or 'image/png'
        )

        template_image_url = supabase.storage.from_(TEMPLATE_BUCKET).get_public_url(filename)
        print(f"Template image uploaded to Supabase bucket '{TEMPLATE_BUCKET}': {template_image_url}")
    except RuntimeError as exc:
        print(f"Supabase storage client not configured: {exc}")
    except Exception as e:
        print(f"Failed to upload template image to Supabase: {e}")
        # Continue anyway, template will work from local storage
    
    layout_payload = None
    if layout:
        try:
            layout_payload = json.loads(layout)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid layout JSON: {exc}") from exc
    try:
        return template_manager.add_template(safe_id, name, filename, layout_payload, template_image_url)
    except ValueError as exc:
        if os.path.exists(tmp_filepath):
            os.remove(tmp_filepath)
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


@router.delete("/templates/{template_id}")
def delete_template(template_id: str, admin_secret: str):
    verify_admin(admin_secret)
    try:
        deleted = template_manager.delete_template(template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    
    # Try to delete image from Supabase Storage if it has an image_url
    if deleted.get("image_url"):
        try:
            filename = deleted["file"]
            s3_client = template_manager.get_storage_client()
            s3_client.delete_object(Bucket=TEMPLATE_BUCKET, Key=filename)
            print(f"Deleted template image from Supabase bucket '{TEMPLATE_BUCKET}': {filename}")
        except RuntimeError as exc:
            print(f"Supabase storage client not configured: {exc}")
        except Exception as e:
            print(f"Failed to delete template image from Supabase: {e}")
            # Continue anyway, template config is already deleted
    
    return {"message": f"Template '{template_id}' deleted successfully"}


@router.post("/templates/{template_id}/image", response_model=schemas.CertificateTemplate)
async def update_template_image(
    template_id: str,
    admin_secret: str = Form(...),
    image: UploadFile = File(...)
):
    verify_admin(admin_secret)
    try:
        template = template_manager.get_template(template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    allowed_types = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/webp": ".webp",
    }
    suffix = allowed_types.get(image.content_type or "")
    if not suffix:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"{template_id}{suffix}"
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    os.makedirs("/tmp/templates", exist_ok=True)
    tmp_filepath = os.path.join("/tmp/templates", filename)
    with open(tmp_filepath, "wb") as handle:
        handle.write(content)

    template_image_url = None
    try:
        s3_client = template_manager.get_storage_client()
        s3_client.put_object(
            Bucket=TEMPLATE_BUCKET,
            Key=filename,
            Body=content,
            ContentType=image.content_type or 'image/png'
        )

        template_image_url = supabase.storage.from_(TEMPLATE_BUCKET).get_public_url(filename)
        print(f"Template image updated on Supabase bucket '{TEMPLATE_BUCKET}': {template_image_url}")
    except RuntimeError as exc:
        print(f"Supabase storage client not configured: {exc}")
    except Exception as e:
        print(f"Failed to upload template image to Supabase: {e}")

    updates = {"file": filename}
    if template_image_url:
        updates["image_url"] = template_image_url

    updated = template_manager.update_template(template_id, updates)
    return updated


@router.post("/templates/{template_id}/test", response_class=StreamingResponse)
def test_template_pdf(
    template_id: str,
    payload: schemas.TemplateTestRequest,
    admin_secret: str,
):
    verify_admin(admin_secret)
    try:
        template = template_manager.get_template(template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    layout_source = payload.layout or template.get("layout") or {}
    layout = json.loads(json.dumps(layout_source))

    try:
        event_res = supabase.table("events").select("*").eq("id", payload.event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    event_row = event_res.data[0] if event_res.data else None
    if not event_row:
        raise HTTPException(status_code=404, detail="Event not found")

    participant_row = None
    if payload.participant_id:
        try:
            participant_res = (
                supabase.table("participants")
                .select("*")
                .eq("event_id", payload.event_id)
                .eq("id", payload.participant_id)
                .limit(1)
                .execute()
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
        participant_row = participant_res.data[0] if participant_res.data else None
    if not participant_row:
        try:
            fallback_res = supabase.table("participants").select("*").eq("event_id", payload.event_id).limit(1).execute()
            participant_row = fallback_res.data[0] if fallback_res.data else None
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc

    participant_name = (participant_row or {}).get("name") or "Sample Student"
    event_name = event_row.get("name", "Sample Event")
    event_date = event_row.get("date", "")
    code = generate_code(prefix="TEST")

    pdf_stream = generate_certificate_preview_pdf(
        participant_name=participant_name,
        event_name=event_name,
        event_date=event_date,
        code=code,
        template=template,
        layout=layout,
        participant_data=participant_row,
    )

    headers = {
        "Content-Disposition": f"attachment; filename={template_id}-preview.pdf"
    }
    return StreamingResponse(pdf_stream, media_type="application/pdf", headers=headers)



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