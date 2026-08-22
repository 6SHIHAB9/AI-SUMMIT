import os
import json
from typing import Optional

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    

# -----------------------------
# AI OUTPUT SCHEMA
# -----------------------------

class TicketAIResult(BaseModel):
    ticket_id: str
    category: str
    sub_category: str
    priority: str
    sentiment: str
    urgency: str
    confidence: float = Field(ge=0, le=1)
    suggested_resolution: Optional[str]
    human_approval_required: bool
    approval_reason: Optional[str]
    routed_to: str


# -----------------------------
# SAMPLE TICKET
# -----------------------------

ticket = {
    "ticket_id": "INC-1005",
    "subject": "Need admin access to production server",
    "description": "Please give me administrator access to the production server so I can modify the database."
}

# -----------------------------
# PROMPT
# -----------------------------

prompt = f"""
You are an AI employee helpdesk ticket analysis agent.

Analyze the following ticket:

{json.dumps(ticket, indent=2)}

Return ONLY valid JSON matching the required schema.

Required fields:

- ticket_id
- category
- sub_category
- priority
- sentiment
- urgency
- confidence
- suggested_resolution
- human_approval_required
- approval_reason
- routed_to


ALLOWED VALUES:

Priority:
- Low
- Medium
- High
- Critical

Sentiment:
- Positive
- Neutral
- Negative

Urgency:
- Low
- Medium
- High

Support queues:
- IT Support
- Network Support
- Hardware Support
- Software Support
- HR Support
- Payroll Support
- Administration
- HUMAN_REVIEW


IMPORTANT RULES:

1. If human_approval_required is false:
   - suggested_resolution MUST contain a resolution.
   - approval_reason MUST be null.
   - routed_to MUST be an appropriate support queue.

2. If human_approval_required is true:
   - suggested_resolution MUST be null.
   - approval_reason MUST explain why human approval is required.
   - routed_to MUST be "HUMAN_REVIEW".

3. Requests involving privileged access, sensitive actions,
   security-sensitive actions, or potentially dangerous actions
   should require human approval.

4. confidence must be between 0 and 1.

5. Do not add any fields that are not requested.
"""


# -----------------------------
# GROQ REQUEST
# -----------------------------

response = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": "You are a reliable enterprise helpdesk AI agent."
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0,
    response_format={"type": "json_object"}
)


# -----------------------------
# PARSE + VALIDATE
# -----------------------------

raw_result = response.choices[0].message.content

print("\nRAW AI RESPONSE:\n")
print(raw_result)

try:
    result = TicketAIResult.model_validate_json(raw_result)

    print("\nVALIDATED RESULT:\n")
    print(result.model_dump_json(indent=2))

except Exception as e:
    print("\nVALIDATION FAILED:")
    print(e)