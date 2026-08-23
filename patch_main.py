import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

validation_check = '''    ai_data = process_ticket(new_ticket_id, ticket.subject, ticket.description)
    if ai_data and not ai_data.get("ticket_valid", True):
        reason = ai_data.get("rejection_reason") or "Your request is too vague. Please provide more details."
        raise HTTPException(status_code=400, detail=f"INVALID_TICKET:{reason}")
'''
content = content.replace('    ai_data = process_ticket(new_ticket_id, ticket.subject, ticket.description)', validation_check)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
