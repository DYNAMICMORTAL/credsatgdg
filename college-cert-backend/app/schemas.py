from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal

class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    date: str

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None
    roll_no: Optional[str] = None
    department: Optional[str] = None

class ParticipantCreate(ParticipantBase):
    event_id: int

class Participant(ParticipantBase):
    id: int
    event_id: int
    
    class Config:
        orm_mode = True

class Certificate(BaseModel):
    id: int
    event_id: int
    participant_id: int
    certificate_code: str
    certificate_path: str
    status: str
    issued_at: datetime
    
    class Config:
        orm_mode = True

class VerificationResponse(BaseModel):
    status: str  # "valid" / "invalid" / "revoked"
    message: str
    name: Optional[str] = None
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    issued_at: Optional[datetime] = None
    certificate_code: Optional[str] = None


class FieldPlacement(BaseModel):
    x: float
    y: float
    font_size: Optional[int] = None
    align: Literal["left", "center", "right"] = "center"
    color: Optional[str] = "#000000"
    font_family: Optional[str] = None


class QRPlacement(BaseModel):
    x: float
    y: float
    size: float = 0.15


class LayoutOverride(BaseModel):
    name: Optional[FieldPlacement] = None
    event: Optional[FieldPlacement] = None
    date: Optional[FieldPlacement] = None
    code: Optional[FieldPlacement] = None
    qr: Optional[QRPlacement] = None
    
    class Config:
        extra = "allow"  # Allow additional fields for custom fields


class TemplateLayout(BaseModel):
    name: FieldPlacement
    event: FieldPlacement
    date: FieldPlacement
    code: FieldPlacement
    qr: QRPlacement
    
    class Config:
        extra = "allow"  # Allow additional fields for custom fields


class CertificateTemplate(BaseModel):
    id: str
    name: str
    file: str
    layout: TemplateLayout


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    file: Optional[str] = None
    layout: Optional[dict] = None  # Changed to dict to accept any layout structure


class CertificateGenerationRequest(BaseModel):
    template_id: str
    layout_override: Optional[LayoutOverride] = None
