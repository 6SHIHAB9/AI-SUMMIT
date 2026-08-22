from enum import Enum


class Department(str, Enum):
    IT_SUPPORT = "IT Support"
    NETWORK_SUPPORT = "Network Support"
    HARDWARE_SUPPORT = "Hardware Support"
    SOFTWARE_SUPPORT = "Software Support"
    HR_SUPPORT = "HR Support"
    PAYROLL_SUPPORT = "Payroll Support"
    ADMINISTRATION = "Administration"
    SECURITY_SUPPORT = "Security Support"


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


# Plain string list — used for prompt-building and membership checks
DEPARTMENTS = [d.value for d in Department]
PRIORITIES = [p.value for p in Priority]

# Special routing states — NOT departments
HUMAN_REVIEW = "HUMAN_REVIEW"
REJECTED = "REJECTED"

# What routed_to may be immediately after ticket creation (AI stage only)
ALL_ROUTING_VALUES = DEPARTMENTS + [HUMAN_REVIEW]

# Safe fallback department if the AI returns something invalid
DEFAULT_DEPARTMENT = Department.IT_SUPPORT.value