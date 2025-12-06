from fastapi import APIRouter, HTTPException, UploadFile, File
from .. import schemas
from ..database import supabase
from ..services import email_service
from ..services.certificate_generator import generate_certificate_image, generate_code
from ..services import template_manager
import csv
import io
import os
import openpyxl
import requests
from typing import Optional

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")

def verify_admin(secret: str):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/", response_model=schemas.Participant)
def add_participant(p: schemas.ParticipantCreate, admin_secret: str):
    verify_admin(admin_secret)
    try:
        event = supabase.table("events").select("id").eq("id", p.event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    event_row = event.data[0] if event.data else None
    if not event_row:
        raise HTTPException(status_code=404, detail="Event not found")
    data = p.dict()
    try:
        res = supabase.table("participants").insert(data).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase insert failed: {exc}") from exc
    return res.data[0]

@router.post("/upload_csv")
async def upload_participants(event_id: int, admin_secret: str, file: UploadFile = File(...)):
    """Upload participants from CSV file"""
    verify_admin(admin_secret)
    # Check if event exists
    try:
        event = supabase.table("events").select("id").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    contents = await file.read()
    text = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    count = 0
    for row in reader:
        data = {
            "event_id": event_id,
            "name": row.get("name"),
            "email": row.get("email"),
            "roll_no": row.get("roll_no"),
            "department": row.get("department")
        }
        supabase.table("participants").insert(data).execute()
        count += 1
    return {"message": f"Uploaded {count} participants"}

@router.post("/upload_excel")
async def upload_excel(event_id: int, admin_secret: str, file: UploadFile = File(...)):
    """Upload participants from Excel (.xlsx) file - dynamically reads all columns"""
    verify_admin(admin_secret)
    
    # Check if event exists
    try:
        event = supabase.table("events").select("id").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Validate file extension
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    contents = await file.read()
    
    try:
        # Load workbook from bytes
        workbook = openpyxl.load_workbook(io.BytesIO(contents))
        sheet = workbook.active
        
        # Get headers from first row
        headers = [cell.value for cell in sheet[1]]
        
        # Normalize header names (lowercase, underscores, strip spaces)
        header_map = {}
        for idx, header in enumerate(headers):
            if header:
                normalized = str(header).strip().lower().replace(" ", "_").replace("-", "_")
                header_map[idx] = normalized
        
        count = 0
        # Process data rows (skip header)
        for row in sheet.iter_rows(min_row=2, values_only=True):
            # Skip empty rows
            if not any(row):
                continue
                
            # Dynamically build data from all columns
            data = {"event_id": event_id}
            
            for idx, value in enumerate(row):
                if idx in header_map and value is not None:
                    # Convert value to string and strip whitespace
                    str_value = str(value).strip()
                    if str_value:  # Only add non-empty values
                        data[header_map[idx]] = str_value
            
            # Ensure we have at least a name field
            has_name = any(k in data for k in ["name", "student_name", "participant_name"])
            
            if has_name:
                supabase.table("participants").insert(data).execute()
                count += 1
        
        return {"message": f"Uploaded {count} participants from Excel file"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")

@router.post("/upload_google_sheets")
async def upload_from_google_sheets(event_id: int, admin_secret: str, sheets_url: str):
    """Upload participants from Google Sheets URL - dynamically reads all columns"""
    verify_admin(admin_secret)
    
    # Check if event exists
    try:
        event = supabase.table("events").select("id").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Extract spreadsheet ID from URL
    try:
        # Google Sheets URL formats:
        # https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit...
        if "/spreadsheets/d/" not in sheets_url:
            raise HTTPException(status_code=400, detail="Invalid Google Sheets URL")
        
        # Convert to CSV export URL
        spreadsheet_id = sheets_url.split("/spreadsheets/d/")[1].split("/")[0]
        csv_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
        
        # Download CSV data
        response = requests.get(csv_url, timeout=10)
        response.raise_for_status()
        
        # Parse CSV
        text = response.text
        reader = csv.DictReader(io.StringIO(text))
        
        count = 0
        for row in reader:
            # Dynamically build data from all columns in the row
            data = {"event_id": event_id}
            
            # Normalize column names and add all non-empty values
            for key, value in row.items():
                if key and value:  # Skip empty columns and values
                    # Normalize key to lowercase with underscores
                    normalized_key = key.strip().lower().replace(" ", "_").replace("-", "_")
                    data[normalized_key] = value.strip()
            
            # Ensure we have at least a name field
            has_name = any(k in data for k in ["name", "student_name", "participant_name"])
            
            if has_name:
                supabase.table("participants").insert(data).execute()
                count += 1
        
        return {"message": f"Uploaded {count} participants from Google Sheets"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch Google Sheets: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process Google Sheets data: {str(e)}")

@router.get("/by_event/{event_id}", response_model=list[schemas.Participant])
def list_participants_by_event(event_id: int, admin_secret: str):
    verify_admin(admin_secret)
    try:
        res = supabase.table("participants").select("*").eq("event_id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    return res.data


@router.post("/send_certificate_links/{event_id}")
async def send_certificate_links(event_id: int, admin_secret: str, template_id: str):
    """Send certificate generation links to all participants via email"""
    verify_admin(admin_secret)
    
    # Get event details
    try:
        event_res = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch event: {exc}") from exc
    
    if not event_res.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = event_res.data[0]
    
    # Get all participants for this event
    try:
        participants_res = supabase.table("participants").select("*").eq("event_id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch participants: {exc}") from exc
    
    if not participants_res.data:
        raise HTTPException(status_code=404, detail="No participants found for this event")
    
    participants = participants_res.data
    sent_count = 0
    failed_count = 0
    failed_emails = []
    
    for participant in participants:
        # Generate unique token for this participant
        token = email_service.generate_participant_token(participant["id"], event_id)
        
        # Store token in database
        try:
            supabase.table("participants").update({
                "certificate_token": token,
                "template_id": template_id
            }).eq("id", participant["id"]).execute()
        except Exception as exc:
            print(f"Failed to update participant {participant['id']} with token: {exc}")
            failed_count += 1
            continue
        
        # Send email if participant has email
        if participant.get("email"):
            try:
                success = await email_service.send_certificate_link_email(
                    participant_email=participant["email"],
                    participant_name=participant["name"],
                    event_name=event["name"],
                    token=token
                )
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
                    failed_emails.append(participant["email"])
            except Exception as exc:
                print(f"Failed to send email to {participant['email']}: {exc}")
                failed_count += 1
                failed_emails.append(participant["email"])
        else:
            failed_count += 1
    
    return {
        "message": f"Sent {sent_count} emails successfully",
        "sent": sent_count,
        "failed": failed_count,
        "failed_emails": failed_emails
    }


@router.get("/decode_token/{token}")
async def decode_token(token: str):
    """Decode participant token and return participant info"""
    decoded = email_service.decode_participant_token(token)
    
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    event_id, participant_id = decoded
    
    # Get participant details
    try:
        participant_res = supabase.table("participants").select("*").eq("id", participant_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch participant: {exc}") from exc
    
    if not participant_res.data:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    participant = participant_res.data[0]
    
    # Verify token matches
    if participant.get("certificate_token") != token:
        raise HTTPException(status_code=401, detail="Token mismatch or expired")
    
    # Get event details
    try:
        event_res = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch event: {exc}") from exc
    
    if not event_res.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = event_res.data[0]
    
    # Check if certificate already exists
    try:
        cert_res = supabase.table("certificates").select("*").eq("participant_id", participant_id).eq("event_id", event_id).limit(1).execute()
    except Exception as exc:
        cert_res = None
    
    certificate = cert_res.data[0] if cert_res and cert_res.data else None
    
    return {
        "participant": participant,
        "event": event,
        "certificate": certificate
    }


@router.post("/generate_certificate/{token}")
async def generate_certificate_for_student(token: str):
    """Generate certificate for a student using their unique token"""
    decoded = email_service.decode_participant_token(token)
    
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    event_id, participant_id = decoded
    
    # Get participant details
    try:
        participant_res = supabase.table("participants").select("*").eq("id", participant_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch participant: {exc}") from exc
    
    if not participant_res.data:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    participant = participant_res.data[0]
    
    # Verify token matches
    if participant.get("certificate_token") != token:
        raise HTTPException(status_code=401, detail="Token mismatch or expired")
    
    # Check if certificate already exists
    try:
        existing = supabase.table("certificates").select("*").eq("participant_id", participant_id).eq("event_id", event_id).limit(1).execute()
        if existing.data:
            return existing.data[0]
    except Exception:
        pass
    
    # Get event details
    try:
        event_res = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch event: {exc}") from exc
    
    if not event_res.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = event_res.data[0]
    
    # Get template
    template_id = participant.get("template_id")
    if not template_id:
        raise HTTPException(status_code=400, detail="No template assigned to participant")
    
    try:
        template = template_manager.get_template(template_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    
    layout = template.get("layout", {})
    
    # Generate certificate code
    cert_code = generate_code()
    
    # Prepare participant data with all custom fields
    participant_data = {
        "name": participant.get("name", ""),
        "email": participant.get("email", ""),
        "roll_no": participant.get("roll_no", ""),
        "department": participant.get("department", ""),
    }
    
    # Add any extra fields from participant
    for key, value in participant.items():
        if key not in ["id", "event_id", "certificate_token", "template_id"] and value is not None:
            participant_data[key] = str(value)
    
    # Generate certificate image
    try:
        cert_path = generate_certificate_image(
            participant_name=participant.get("name", ""),
            event_name=event["name"],
            event_date=event.get("date", ""),
            code=cert_code,
            template=template,
            layout=layout,
            participant_data=participant_data,
        )
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate certificate: {exc}") from exc
    
    # Save certificate record
    cert_data = {
        "event_id": event_id,
        "participant_id": participant_id,
        "certificate_code": cert_code,
        "certificate_path": cert_path,
        "status": "valid",
    }
    
    try:
        cert_res = supabase.table("certificates").insert(cert_data).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save certificate: {exc}") from exc
    
    return cert_res.data[0]

