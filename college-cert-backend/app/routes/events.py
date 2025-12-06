from fastapi import APIRouter, Depends, HTTPException
from .. import schemas
from ..database import supabase
# from .. import models
from sqlalchemy.orm import Session
import os

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")

def verify_admin(secret: str):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.post("/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, admin_secret: str):
    verify_admin(admin_secret)
    data = event.dict()
    try:
        res = supabase.table("events").insert(data).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase insert failed: {exc}") from exc
    return res.data[0]

@router.get("/", response_model=list[schemas.Event])
def list_events():
    try:
        res = supabase.table("events").select("*").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    return res.data

@router.get("/{event_id}", response_model=schemas.Event)
def get_event(event_id: int):
    try:
        res = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    event_data = res.data[0] if res.data else None
    if not event_data:
        raise HTTPException(status_code=404, detail="Event not found")
    return event_data

@router.patch("/{event_id}/deactivate", response_model=schemas.Event)
def deactivate_event(event_id: int, admin_secret: str):
    verify_admin(admin_secret)
    try:
        res = supabase.table("events").update({"is_active": False}).eq("id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase update failed: {exc}") from exc
    if not res.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return res.data[0]
