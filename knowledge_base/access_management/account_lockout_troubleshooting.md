Title: Account Lockout Troubleshooting
Department: Access Management
Document Type: Troubleshooting Guide
Purpose: Help resolve situations where an employee's account has been locked due to failed login attempts or suspicious activity.
Applicable Issues: Account locked, too many login attempts, account temporarily disabled, locked out of Employee Portal, locked out after failed MFA attempts.

Symptoms:
- Employee sees a message stating the account is locked after multiple failed login attempts
- Employee is unable to log in even with the correct password
- Account was automatically locked following a security alert (e.g., login attempt from an unrecognized location)

Troubleshooting / Procedure:
1. Confirm with the employee how many login attempts were made and whether the password being used is correct (if uncertain, direct to Password Reset Procedure first).
2. Check the account status in the Access Management admin console to confirm lockout reason (failed attempts vs. security flag).
3. For standard failed-attempt lockouts, accounts typically auto-unlock after 30 minutes; offer this as the first option.
4. If immediate access is required, Access Management can manually unlock the account after verifying the employee's identity.
5. If the lockout was triggered by a security flag (unusual location, impossible travel, etc.), do not unlock without confirming the login attempt was legitimate with the employee directly.

Expected Result: Account is unlocked and the employee can log in successfully.

Escalation Criteria: Escalate immediately to Access Management security review if the lockout was triggered by suspicious activity that the employee cannot explain, as this may indicate a compromised account.

Important Notes: This document covers lockouts only. Forgotten passwords without a lockout are covered in Password Reset Procedure. Never unlock an account without identity verification.
