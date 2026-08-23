import os
import json
import uuid
from typing import List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
import shutil
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from groq import Groq
from dotenv import load_dotenv

from datetime import datetime, timezone
import models
import schemas
from database import engine, get_db, ensure_schema_columns
from ai_service import process_ticket
from constants import DEPARTMENTS, HUMAN_REVIEW, DEFAULT_DEPARTMENT

load_dotenv()

# Create all database tables and ensure column migrations
models.Base.metadata.create_all(bind=engine)
ensure_schema_columns()

app = FastAPI(title="Intelligent Helpdesk API")

@app.on_event("startup")
def startup_event():
    import threading
    from ingest_kb import ingest_kb
    print("Starting background task to ingest Knowledge Base...")
    # Run ingestion in a background thread so it doesn't block the server startup
    threading.Thread(target=ingest_kb, daemon=True).start()

def resolve_department(dept_str: str):
    """Matches a department name from string or slug format."""
    for d in DEPARTMENTS:
        if d.lower() == dept_str.lower():
            return d
        if d.lower().replace(" ", "-") == dept_str.lower():
            return d
    return None

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')

@app.post('/upload')
def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in ['png', 'jpg', 'jpeg', 'webp']:
        raise HTTPException(status_code=400, detail='Unsupported file type. Only PNG, JPG, JPEG, WEBP are allowed.')
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {'filename': unique_filename}

@app.post("/tickets", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    new_ticket_id = f"INC-{uuid.uuid4().hex[:6].upper()}"

    ai_data = process_ticket(new_ticket_id, ticket.subject, ticket.description)
    if not ai_data:
        ai_data = {
            "category": "General",
            "sub_category": "General Inquiry",
            "priority": "Medium",
            "sentiment": "Neutral",
            "urgency": "Medium",
            "confidence": 0.0,
            "suggested_resolution": None,
            "human_approval_required": True,
            "approval_reason": "Automated processing could not safely evaluate this ticket. Sent for human review.",
            "routed_to": HUMAN_REVIEW,
        }

    human_approval = bool(ai_data.get("human_approval_required", False))
    status = "Pending Review" if human_approval else "Open"
    routed_to = HUMAN_REVIEW if human_approval else ai_data.get("routed_to", DEFAULT_DEPARTMENT)
    approval_reason = ai_data.get("approval_reason") if human_approval else None

    # STAGE 2 & 3: RAG Knowledge Retrieval & Resolution
    kb_match = False
    kb_sources_json = None
    suggested_resolution = None
    kb_message = None
    
    if not human_approval:
        from rag.generator import generate_rag_resolution
        rag_resolution, is_match, kb_sources = generate_rag_resolution(ticket.subject, ticket.description)
        if is_match:
            kb_match = True
            kb_sources_json = json.dumps(kb_sources)
            suggested_resolution = rag_resolution
        else:
            kb_message = "No relevant resolution found in the Knowledge Base."

    db_ticket = models.Ticket(
        ticket_id=new_ticket_id,
        raised_by="employee@tcs.com",
        subject=ticket.subject,
        description=ticket.description,
        attachment=ticket.attachment,
        status=status,
        category=ai_data.get("category", "General"),
        sub_category=ai_data.get("sub_category", "General Inquiry"),
        priority=ai_data.get("priority", "Medium"),
        sentiment=ai_data.get("sentiment", "Neutral"),
        urgency=ai_data.get("urgency", "Medium"),
        confidence=ai_data.get("confidence", 0.90),
        suggested_resolution=suggested_resolution,
        kb_match=kb_match,
        kb_sources=kb_sources_json,
        kb_message=kb_message,
        human_approval_required=human_approval,
        approval_reason=approval_reason,
        routed_to=routed_to
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@app.get("/tickets", response_model=List[schemas.TicketResponse])
def get_all_tickets(db: Session = Depends(get_db)):
    return db.query(models.Ticket).order_by(models.Ticket.created_at.desc()).all()

@app.get("/tickets/review", response_model=List[schemas.TicketResponse])
def get_review_tickets(db: Session = Depends(get_db)):
    return db.query(models.Ticket).filter(
        models.Ticket.human_approval_required == True,
        models.Ticket.status == "Pending Review"
    ).order_by(models.Ticket.created_at.desc()).all()

@app.get("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.put("/tickets/{ticket_id}/approve", response_model=schemas.TicketResponse)
def approve_ticket(ticket_id: str, payload: schemas.TicketApprove, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "Pending Review":
        raise HTTPException(status_code=400, detail="Ticket is not pending review.")

    ticket.status = "Open"
    ticket.human_approval_required = False
    ticket.routed_to = payload.routed_to.value

    # Update category, sub_category, priority, urgency, sentiment
    if payload.category and payload.category.strip():
        ticket.category = payload.category.strip()
    elif not ticket.category or ticket.category.strip() in ["General", ""]:
        ticket.category = payload.routed_to.value

    if payload.sub_category and payload.sub_category.strip():
        ticket.sub_category = payload.sub_category.strip()
    elif not ticket.sub_category or ticket.sub_category.strip() in ["General Inquiry", ""]:
        ticket.sub_category = f"{payload.routed_to.value} General"

    # Reviewer-editable fields
    if payload.priority:
        ticket.priority = payload.priority.value

    if payload.urgency and payload.urgency.strip():
        ticket.urgency = payload.urgency.strip().capitalize()

    if payload.sentiment and payload.sentiment.strip():
        ticket.sentiment = payload.sentiment.strip().capitalize()

    db.commit()
    db.refresh(ticket)
    return ticket

@app.put("/tickets/{ticket_id}/reject", response_model=schemas.TicketResponse)
def reject_ticket(ticket_id: str, payload: schemas.TicketReject, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "Pending Review":
        raise HTTPException(status_code=400, detail="Ticket is not pending review.")

    ticket.status = "Rejected"
    ticket.human_approval_required = False
    ticket.routed_to = "REJECTED"
    ticket.rejection_reason = payload.reason

    db.commit()
    db.refresh(ticket)
    return ticket

@app.put("/tickets/{ticket_id}/modify", response_model=schemas.TicketResponse)
def modify_ticket(ticket_id: str, payload: schemas.TicketModify, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "Pending Review":
        raise HTTPException(status_code=400, detail="Ticket is not pending review.")

    ticket.category = payload.category
    ticket.sub_category = payload.sub_category
    ticket.priority = payload.priority.value

    # Status, human_approval_required, and routed_to are intentionally left
    # unchanged â€” Modify only edits triage fields. Approve is a separate,
    # explicit action that opens the ticket and sets the final department.
    # Urgency is no longer reviewer-editable â€” it stays as the AI's original value.

    db.commit()
    db.refresh(ticket)
    return ticket

# ==============================================================================
# RESOLVER ENDPOINTS
# ==============================================================================

@app.get("/resolver/departments", response_model=List[schemas.DepartmentCountResponse])
def get_resolver_departments(db: Session = Depends(get_db)):
    """Returns the 8 departments and the count of pending tickets (Open or In Progress) in each."""
    dept_counts = []
    for dept in DEPARTMENTS:
        count = db.query(models.Ticket).filter(
            models.Ticket.routed_to == dept,
            models.Ticket.status.in_(["Open", "In Progress"])
        ).count()
        dept_counts.append(schemas.DepartmentCountResponse(
            department=dept,
            ticket_count=count
        ))
    return dept_counts

@app.get("/resolver/tickets/{department_or_id}", response_model=List[schemas.TicketResponse])
def get_resolver_department_tickets(department_or_id: str, db: Session = Depends(get_db)):
    """
    Returns tickets assigned to a given department that are Open or In Progress.
    If the parameter is a direct ticket ID, returns a list containing that ticket.
    """
    resolved_dept = resolve_department(department_or_id)
    if resolved_dept:
        return db.query(models.Ticket).filter(
            models.Ticket.routed_to == resolved_dept,
            models.Ticket.status.in_(["Open", "In Progress"])
        ).order_by(models.Ticket.created_at.desc()).all()

    # Check if parameter is a specific ticket_id
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == department_or_id).first()
    if ticket:
        return [ticket]

    raise HTTPException(
        status_code=404,
        detail=f"Department or ticket '{department_or_id}' not found. Must be one of: {', '.join(DEPARTMENTS)}"
    )

@app.get("/resolver/ticket/{ticket_id}", response_model=schemas.TicketResponse)
def get_resolver_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Returns complete ticket details for a resolver."""
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.put("/resolver/tickets/{ticket_id}/status", response_model=schemas.TicketResponse)
def update_resolver_ticket_status(ticket_id: str, payload: schemas.ResolverStatusUpdate, db: Session = Depends(get_db)):
    """
    Updates the status and resolver comments/reasons for a ticket.
    Allowed statuses: Open, In Progress, Resolved, Rejected.
    Resolved and Rejected require a mandatory comment.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == "Pending Review" or ticket.routed_to == HUMAN_REVIEW:
        raise HTTPException(
            status_code=400,
            detail="Ticket is pending human review and cannot be updated by a resolver."
        )

    now = datetime.now(timezone.utc)
    new_status = payload.status
    comment = payload.comment.strip() if payload.comment else None

    if new_status == "Resolved":
        ticket.status = "Resolved"
        ticket.resolver_comment = comment
        ticket.resolved_at = now
        ticket.resolver_updated_at = now
    elif new_status == "Rejected":
        ticket.status = "Rejected"
        ticket.resolver_comment = comment
        ticket.resolver_rejection_reason = comment
        ticket.rejection_reason = comment
        ticket.resolver_updated_at = now
    elif new_status == "In Progress":
        ticket.status = "In Progress"
        if comment:
            ticket.resolver_comment = comment
        ticket.resolver_updated_at = now
    elif new_status == "Open":
        ticket.status = "Open"
        if comment:
            ticket.resolver_comment = comment
        ticket.resolver_updated_at = now

    db.commit()
    db.refresh(ticket)
    return ticket
