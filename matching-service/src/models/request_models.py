"""
Pydantic models for matching service requests and responses
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

class ExpertiseLevel(str, Enum):
    """Expertise level enumeration"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"
    MASTER = "master"

class SessionType(str, Enum):
    """Session type enumeration"""
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    WORKSHOP = "workshop"
    MENTORING = "mentoring"

class PriorityLevel(str, Enum):
    """Priority level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class SkillRequirement(BaseModel):
    """Skill requirement model"""
    name: str = Field(..., description="Skill name")
    level: ExpertiseLevel = Field(..., description="Required expertise level")
    weight: float = Field(default=1.0, ge=0.0, le=1.0, description="Importance weight")
    mandatory: bool = Field(default=False, description="Whether this skill is mandatory")

class BudgetConstraint(BaseModel):
    """Budget constraint model"""
    max_hourly_rate: Optional[float] = Field(None, ge=0, description="Maximum hourly rate")
    total_budget: Optional[float] = Field(None, ge=0, description="Total budget for the program")
    currency: str = Field(default="USD", description="Currency code")
    payment_frequency: str = Field(default="hourly", description="Payment frequency")

class AvailabilityRequirement(BaseModel):
    """Availability requirement model"""
    days_of_week: List[int] = Field(..., description="Required days (0=Monday, 6=Sunday)")
    time_slots: List[str] = Field(..., description="Preferred time slots")
    timezone: str = Field(default="UTC", description="Timezone")
    flexibility: float = Field(default=0.5, ge=0.0, le=1.0, description="Schedule flexibility")

    @validator('days_of_week', pre=True)
    def validate_days_of_week(cls, v):
        if isinstance(v, list):
            for day in v:
                if not 0 <= day <= 6:
                    raise ValueError("Days of week must be between 0 (Monday) and 6 (Sunday)")
        return v
class MatchingRequest(BaseModel):
    """Main matching request model"""
    request_id: str = Field(..., description="Unique request identifier")
    company_id: str = Field(..., description="Company identifier")
    program_id: str = Field(..., description="Program identifier")
    
    # Request details
    title: str = Field(..., description="Program title")
    description: str = Field(..., description="Program description")
    session_type: SessionType = Field(..., description="Type of sessions")
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM, description="Request priority")
    
    # Requirements
    skills_required: List[SkillRequirement] = Field(..., description="Required skills")
    experience_level: ExpertiseLevel = Field(..., description="Minimum experience level")
    budget_constraints: BudgetConstraint = Field(..., description="Budget constraints")
    availability_requirements: AvailabilityRequirement = Field(..., description="Availability needs")
    
    # Preferences
    preferred_languages: List[str] = Field(default=["English"], description="Preferred languages")
    location_preference: Optional[str] = Field(None, description="Location preference")
    coach_gender_preference: Optional[str] = Field(None, description="Coach gender preference")
    
    # Metadata
    participants_count: int = Field(default=1, ge=1, description="Number of participants")
    session_duration_minutes: int = Field(default=60, ge=15, description="Session duration")
    total_sessions: int = Field(default=1, ge=1, description="Total number of sessions")
    start_date: Optional[datetime] = Field(None, description="Preferred start date")
    end_date: Optional[datetime] = Field(None, description="Preferred end date")
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Request creation time")

class CoachSkill(BaseModel):
    """Coach skill model"""
    name: str = Field(..., description="Skill name")
    level: ExpertiseLevel = Field(..., description="Expertise level")
    years_experience: int = Field(..., ge=0, description="Years of experience")
    certifications: List[str] = Field(default=[], description="Related certifications")

class CoachAvailability(BaseModel):
    """Coach availability model"""
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday)")
    start_time: str = Field(..., description="Start time (HH:MM)")
    end_time: str = Field(..., description="End time (HH:MM)")
    timezone: str = Field(default="UTC", description="Timezone")

class CoachProfile(BaseModel):
    """Coach profile model"""
    coach_id: str = Field(..., description="Unique coach identifier")
    user_id: str = Field(..., description="User identifier")
    
    # Basic info
    first_name: str = Field(..., description="Coach first name")
    last_name: str = Field(..., description="Coach last name")
    email: str = Field(..., description="Coach email")
    
    # Professional info
    title: str = Field(..., description="Professional title")
    company: str = Field(..., description="Current company")
    bio: str = Field(..., description="Biography")
    
    # Skills and experience
    skills: List[CoachSkill] = Field(..., description="Coach skills")
    total_experience_years: int = Field(..., ge=0, description="Total years of experience")
    
    # Availability and pricing
    availability: List[CoachAvailability] = Field(..., description="Available time slots")
    hourly_rate: float = Field(..., ge=0, description="Hourly rate")
    currency: str = Field(default="USD", description="Currency")
    
    # Ratings and metrics
    rating: float = Field(default=0.0, ge=0.0, le=5.0, description="Average rating")
    total_sessions: int = Field(default=0, ge=0, description="Total sessions completed")
    success_rate: float = Field(default=0.0, ge=0.0, le=1.0, description="Success rate")
    response_time_hours: float = Field(default=24.0, ge=0, description="Average response time")
    
    # Preferences
    languages: List[str] = Field(default=["English"], description="Languages spoken")
    max_participants: int = Field(default=1, ge=1, description="Maximum participants per session")
    session_types: List[SessionType] = Field(..., description="Supported session types")
    
    # Status
    is_active: bool = Field(default=True, description="Whether coach is active")
    can_accept_new_clients: bool = Field(default=True, description="Whether accepting new clients")

class MatchResult(BaseModel):
    """Individual match result"""
    coach: CoachProfile = Field(..., description="Matched coach profile")
    match_score: float = Field(..., ge=0.0, le=1.0, description="Overall match score")
    
    # Score breakdown
    skill_score: float = Field(..., ge=0.0, le=1.0, description="Skill match score")
    experience_score: float = Field(..., ge=0.0, le=1.0, description="Experience match score")
    availability_score: float = Field(..., ge=0.0, le=1.0, description="Availability match score")
    price_score: float = Field(..., ge=0.0, le=1.0, description="Price compatibility score")
    rating_score: float = Field(..., ge=0.0, le=1.0, description="Rating score")
    
    # Match details
    matching_skills: List[str] = Field(..., description="Skills that matched")
    missing_skills: List[str] = Field(default=[], description="Required skills not met")
    availability_overlap: float = Field(..., ge=0.0, le=1.0, description="Schedule overlap percentage")
    price_difference_percent: float = Field(..., description="Price difference from budget")
    
    # Recommendations
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="Confidence in this match")
    recommendation_reason: str = Field(..., description="Why this coach is recommended")

class MatchingResponse(BaseModel):
    """Matching response model"""
    request_id: str = Field(..., description="Original request identifier")
    matches: List[MatchResult] = Field(..., description="List of matched coaches")
    
    # Metadata
    total_coaches_evaluated: int = Field(..., ge=0, description="Total coaches considered")
    processing_time_ms: int = Field(..., ge=0, description="Processing time in milliseconds")
    algorithm_version: str = Field(..., description="Algorithm version used")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    # Statistics
    average_match_score: float = Field(..., ge=0.0, le=1.0, description="Average match score")
    best_match_score: float = Field(..., ge=0.0, le=1.0, description="Best match score")
    
    # Filters applied
    filters_applied: Dict[str, Any] = Field(default={}, description="Filters that were applied")

class MatchingError(BaseModel):
    """Matching error model"""
    request_id: str = Field(..., description="Request identifier")
    error_code: str = Field(..., description="Error code")
    error_message: str = Field(..., description="Error message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    details: Dict[str, Any] = Field(default={}, description="Additional error details")
