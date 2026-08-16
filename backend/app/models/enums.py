import enum

class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    BOTH = "both"

class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    VIEWED = "viewed"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    GHOSTED = "ghosted"
    WITHDRAWN = "withdrawn"

class PostingStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    FLAGGED_SUSPICIOUS = "flagged_suspicious"

class EntityType(str, enum.Enum):
    COMPANY = "company"
    POSTING = "posting"
