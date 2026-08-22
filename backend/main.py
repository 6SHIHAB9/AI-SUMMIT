import os
import json
import uuid
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from groq import Groq
from dotenv import load_dotenv

import models
import schemas
from database import engine, get_db
from constants import DEPARTMENTS, HUMAN_REVIEW, DEFAULT_DEPARTMENT

load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent Helpdesk API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/tickets", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    new_ticket_id = f"INC-{uuid.uuid4().hex[:6].upper()}"

    department_list_str = "\n".join(f'- "{d}"' for d in DEPARTMENTS)

    # Prompt the Groq model for intelligent triage and human-in-the-loop evaluation
    prompt = f"""
    You are an AI IT Helpdesk Assistant. Analyze the following support ticket and return a JSON object with these exact keys:
    - "category": string (e.g., Network, Hardware, Software, Access Management, HR)
    - "sub_category": string (e.g., VPN, Password Reset, Production Server Access, Laptop)
    - "priority": string (Low, Medium, High, Critical)
    - "sentiment": string (Positive, Neutral, Negative)
    - "urgency": string (Low, Medium, High)
    - "confidence": float between 0.0 and 1.0
    - "suggested_resolution": string or null (provide helpful troubleshooting steps if it can be auto-resolved. MUST be null if human_approval_required is true).
    - "human_approval_required": boolean (true if the request involves security risks, privileged access, financial changes, policy exceptions, or high-risk actions; false otherwise).
    - "approval_reason": string or null (explanation of why human review is required if true, otherwise null).
    - "routed_to": string. This MUST be exactly one of the following values, with no variation in spelling or wording:
    {department_list_str}
    - "HUMAN_REVIEW" (use this ONLY if human_approval_required is true)

    Never invent a department name. Never use synonyms or abbreviations. Copy one of the values above exactly.

    Ticket Subject: {ticket.subject}
    Ticket Description: {ticket.description}

    Return ONLY valid JSON. No markdown code blocks, no extra text.
    """

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b", # Using your specified Groq model
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        content = completion.choices[0].message.content.strip()
        
        # Clean up potential markdown formatting if the model adds it
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        ai_data = json.loads(content.strip())
        
        human_approval = bool(ai_data.get("human_approval_required", False))
        status = "Pending Review" if human_approval else "Open"

        if human_approval:
            routed_to = HUMAN_REVIEW
        else:
            # Server-side safety net: never trust the AI's routed_to blindly.
            candidate = ai_data.get("routed_to")
            routed_to = candidate if candidate in DEPARTMENTS else DEFAULT_DEPARTMENT

        suggested_resolution = None if human_approval else ai_data.get("suggested_resolution")

    except Exception as e:
        # Fallback handling if AI fails or rate limits
        print(f"AI Processing Error: {e}")
        ai_data = {}
        human_approval = False
        status = "Open"
        routed_to = DEFAULT_DEPARTMENT
        suggested_resolution = "AI processing failed. Routed to general support queue."

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
        human_approval_required=human_approval,
        approval_reason=ai_data.get("approval_reason"),
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
    ticket.priority = payload.priority
    ticket.urgency = payload.urgency

    # Status, human_approval_required, and routed_to are intentionally left
    # unchanged — Modify only edits triage fields. Approve is a separate,
    # explicit action that opens the ticket and sets the final department.

    db.commit()
    db.refresh(ticket)
    return ticket