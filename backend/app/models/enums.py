import enum

class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    BOTH = "both"

class ApplicationStatus(str, enum.Enum):
    APPLIED      = "APPLIED"
    VIEWED       = "VIEWED"
    SCREENING    = "SCREENING"
    INTERVIEWING = "INTERVIEWING"
    OFFERED      = "OFFERED"
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    REJECTED     = "REJECTED"
    GHOSTED      = "GHOSTED"
    WITHDRAWN    = "WITHDRAWN"

class PostingStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    FLAGGED_SUSPICIOUS = "flagged_suspicious"

class EntityType(str, enum.Enum):
    COMPANY = "company"
    POSTING = "posting"
