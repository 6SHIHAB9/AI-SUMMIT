from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from constants import Department

class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    attachment: Optional[str] = None

# Reviewer Action Schemas
class TicketReject(BaseModel):
    reason: str = Field(..., min_length=1, description="Mandatory reason for rejection")

class TicketApprove(BaseModel):
    routed_to: Department = Field(..., description="Fixed department to route the ticket to upon approval")

class TicketModify(BaseModel):
    category: str
    sub_category: str
    priority: str
    urgency: str

class TicketResponse(BaseModel):
    ticket_id: str
    raised_by: str
    subject: str
    description: str
    attachment: Optional[str] = None
    created_at: datetime
    status: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[str] = None
    sentiment: Optional[str] = None
    urgency: Optional[str] = None
    confidence: Optional[float] = None
    suggested_resolution: Optional[str] = None
    human_approval_required: bool
    approval_reason: Optional[str] = None
    routed_to: Optional[str] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True