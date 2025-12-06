from fastapi import APIRouter, Depends, HTTPException
from .. import schemas
from ..database import supabase
# from .. import models
from sqlalchemy.orm import Session
from typing import Optional
import os
from pydantic import BaseModel

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "secret")

def verify_admin(secret: str):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


class EventStats(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    date: str
    is_active: bool
    total_participants: int
    total_certificates_issued: int


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

@router.get("/stats/all", response_model=list[EventStats])
def list_events_with_stats():
    """Get all events with statistics"""
    try:
        events = supabase.table("events").select("*").execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    
    results = []
    for event in events.data:
        try:
            participants = supabase.table("participants").select("*", count="exact").eq("event_id", event["id"]).execute()
            certificates = supabase.table("certificates").select("*", count="exact").eq("event_id", event["id"]).execute()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
        
        results.append(EventStats(
            id=event["id"],
            name=event["name"],
            description=event.get("description"),
            date=event["date"],
            is_active=event["is_active"],
            total_participants=len(participants.data) if participants.data else 0,
            total_certificates_issued=len(certificates.data) if certificates.data else 0
        ))
    
    return results

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

@router.get("/{event_id}/stats", response_model=EventStats)
def get_event_stats(event_id: int):
    """Get statistics for a specific event"""
    try:
        event = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    
    event_data = event.data[0] if event.data else None
    if not event_data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    try:
        participants = supabase.table("participants").select("*", count="exact").eq("event_id", event_id).execute()
        certificates = supabase.table("certificates").select("*", count="exact").eq("event_id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase query failed: {exc}") from exc
    
    return EventStats(
        id=event_data["id"],
        name=event_data["name"],
        description=event_data.get("description"),
        date=event_data["date"],
        is_active=event_data["is_active"],
        total_participants=len(participants.data) if participants.data else 0,
        total_certificates_issued=len(certificates.data) if certificates.data else 0
    )

@router.patch("/{event_id}/close", response_model=schemas.Event)
def close_event(event_id: int, admin_secret: str):
    """Close/deactivate an event"""
    verify_admin(admin_secret)
    try:
        res = supabase.table("events").update({"is_active": False}).eq("id", event_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase update failed: {exc}") from exc
    if not res.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return res.data[0]

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