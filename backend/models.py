from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
from datetime import datetime, timezone
from database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True)
    raised_by = Column(String, default="employee@tcs.com")
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    attachment = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="Submitted")
    
    # AI Generated Fields
    category = Column(String, nullable=True)
    sub_category = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    suggested_resolution = Column(Text, nullable=True)
    kb_match = Column(Boolean, default=False)
    kb_sources = Column(Text, nullable=True)
    kb_message = Column(Text, nullable=True)
    human_approval_required = Column(Boolean, default=False)
    approval_reason = Column(Text, nullable=True)
    routed_to = Column(String, nullable=True)
    
    # HITL Reviewer Fields
    rejection_reason = Column(Text, nullable=True)

    # Resolver Fields
    resolver_comment = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolver_updated_at = Column(DateTime, nullable=True)
    resolver_rejection_reason = Column(Text, nullable=True)