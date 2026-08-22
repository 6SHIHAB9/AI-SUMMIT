from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime

from constants import Department, Priority

class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    attachment: Optional[str] = None

# Reviewer Action Schemas
class TicketReject(BaseModel):
    reason: str = Field(..., min_length=1, description="Mandatory reason for rejection")

class TicketApprove(BaseModel):
    routed_to: Department = Field(..., description="Fixed department to route the ticket to upon approval")
    category: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[Priority] = None
    urgency: Optional[str] = None
    sentiment: Optional[str] = None

class TicketModify(BaseModel):
    category: str
    sub_category: str
    priority: Priority

# Resolver Action Schemas
class DepartmentCountResponse(BaseModel):
    department: str
    ticket_count: int

class ResolverStatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["Open", "In Progress", "Resolved", "Rejected"]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

    @model_validator(mode="after")
    def validate_mandatory_comment(self):
        if self.status in ["Resolved", "Rejected"]:
            if not self.comment or not self.comment.strip():
                field_label = "Resolution / comment" if self.status == "Resolved" else "Rejection reason"
                raise ValueError(f"{field_label} is mandatory when status is '{self.status}'")
        return self

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
    
    # Resolver Fields
    resolver_comment: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolver_updated_at: Optional[datetime] = None
    resolver_rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True