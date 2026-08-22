import os
import json
from groq import Groq
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from dotenv import load_dotenv

from constants import DEPARTMENTS, HUMAN_REVIEW

load_dotenv()

class TicketAIResult(BaseModel):
    category: str
    sub_category: str
    priority: str
    sentiment: str
    urgency: str
    confidence: float
    suggested_resolution: Optional[str] = None
    human_approval_required: bool
    approval_reason: Optional[str] = None
    routed_to: str

    @model_validator(mode="after")
    def enforce_routing_rules(self):
        if self.human_approval_required:
            if self.routed_to != HUMAN_REVIEW:
                raise ValueError('routed_to must be "HUMAN_REVIEW" when human_approval_required is true')
        else:
            if self.routed_to not in DEPARTMENTS:
                raise ValueError(f"routed_to must be one of {DEPARTMENTS}")
        return self

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def process_ticket(ticket_id: str, subject: str, description: str) -> Optional[dict]:
    department_list_str = "\n".join(f'      "{d}"' for d in DEPARTMENTS)

    prompt = f"""
    You are an AI IT Helpdesk Assistant. Analyze this support ticket:
    Subject: {subject}
    Description: {description}

    Return ONLY a valid JSON object matching this schema:
    {{
      "category": "string",
      "sub_category": "string",
      "priority": "Low|Medium|High|Critical",
      "sentiment": "Positive|Neutral|Negative",
      "urgency": "Low|Medium|High|Critical",
      "confidence": 0.0 to 1.0,
      "human_approval_required": true/false,
      "suggested_resolution": "string or null",
      "approval_reason": "string or null",
      "routed_to": "string"
    }}

    RULES:
    1. If the request requires elevated privileges, security changes, financial systems, or production admin access, set human_approval_required to true.
    2. If human_approval_required == false:
       - suggested_resolution MUST contain a step-by-step resolution.
       - approval_reason MUST be null.
       - routed_to MUST be exactly one of these values (no variation, no invented names):
{department_list_str}
    3. If human_approval_required == true:
       - suggested_resolution MUST be null.
       - approval_reason MUST explain why human approval is required.
       - routed_to MUST be exactly "HUMAN_REVIEW".
    """

    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        result_json = json.loads(response.choices[0].message.content)
        
        # Failsafe: Enforce rules securely on the backend before Pydantic validation
        if result_json.get("human_approval_required"):
            result_json["suggested_resolution"] = None
            result_json["routed_to"] = HUMAN_REVIEW
        else:
            result_json["approval_reason"] = None

        validated_result = TicketAIResult(**result_json)
        return validated_result.model_dump()
        
    except Exception as e:
        print(f"AI Service Error for {ticket_id}: {str(e)}")
        return None