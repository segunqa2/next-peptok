"""
Core matching service with intelligent coach-to-request matching algorithm
"""

import logging
import time
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

from src.models.request_models import (
    MatchingRequest, CoachProfile, MatchResult, SkillRequirement,
    ExpertiseLevel, SessionType
)
from src.services.redis_service import RedisService
from src.config.settings import Config

logger = logging.getLogger(__name__)

@dataclass
class MatchingMetrics:
    """Metrics for a single matching operation"""
    total_coaches: int
    processing_time_ms: int
    algorithm_version: str
    matches_found: int
    average_score: float
    timestamp: datetime

class MatchingService:
    """Core service for intelligent coach matching"""
    
    def __init__(self):
        self.redis_service = RedisService()
        self.algorithm_version = Config.MATCHING_ALGORITHM_VERSION
        self.weights = Config.get_matching_weights()
        self.last_processing_time = 0
        self.coaches_cache: List[CoachProfile] = []
        self.last_coach_refresh = datetime.min
        
        # Initialize ML components
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.scaler = MinMaxScaler()
        
        # Statistics
        self.total_requests_processed = 0
        self.total_matches_generated = 0
        self.average_processing_time = 0.0
        
        logger.info("Matching service initialized")
    
    def find_matches(self, request: MatchingRequest) -> List[MatchResult]:
        """Find the best matching coaches for a request"""
        start_time = time.time()
        
        try:
            logger.info(f"Starting matching for request {request.request_id}")
            
            # Get available coaches
            coaches = self._get_available_coaches()
            
            if not coaches:
                logger.warning("No coaches available for matching")
                return []
            
            # Pre-filter coaches based on hard constraints
            filtered_coaches = self._apply_hard_filters(coaches, request)
            logger.info(f"Filtered to {len(filtered_coaches)} coaches after hard constraints")
            
            if not filtered_coaches:
                logger.warning("No coaches passed hard filters")
                return []
            
            # Calculate match scores for each coach
            match_results = []
            for coach in filtered_coaches:
                try:
                    match_result = self._calculate_match_score(coach, request)
                    if match_result.match_score >= Config.MIN_MATCH_SCORE:
                        match_results.append(match_result)
                except Exception as e:
                    logger.error(f"Error calculating match for coach {coach.coach_id}: {e}")
            
            # Sort by match score (descending)
            match_results.sort(key=lambda x: x.match_score, reverse=True)
            
            # Limit results
            match_results = match_results[:Config.MAX_MATCHES_PER_REQUEST]
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            self.last_processing_time = processing_time
            
            # Update statistics
            self._update_statistics(len(coaches), len(match_results), processing_time)
            
            # Cache results
            self._cache_results(request.request_id, match_results)
            
            logger.info(f"Matching completed: {len(match_results)} matches found in {processing_time}ms")
            return match_results
            
        except Exception as e:
            logger.error(f"Matching failed for request {request.request_id}: {e}")
            raise
    
    def _get_available_coaches(self) -> List[CoachProfile]:
        """Get list of available coaches"""
        try:
            # Check if we need to refresh coach data
            if self._should_refresh_coaches():
                self._refresh_coach_data()
            
            return [coach for coach in self.coaches_cache if coach.is_active and coach.can_accept_new_clients]
            
        except Exception as e:
            logger.error(f"Failed to get available coaches: {e}")
            return []
    
    def _should_refresh_coaches(self) -> bool:
        """Check if coach data needs to be refreshed"""
        time_since_refresh = datetime.utcnow() - self.last_coach_refresh
        return time_since_refresh.total_seconds() > Config.REFRESH_COACH_DATA_INTERVAL
    
    def _refresh_coach_data(self):
        """Refresh coach data from backend API and cache"""
        try:
            logger.info("Refreshing coach data")
            
            # Try to get from cache first
            cached_coaches = self.redis_service.get_all_coaches()
            
            if cached_coaches:
                self.coaches_cache = [
                    CoachProfile(**coach) for coach in cached_coaches
                ]
                logger.info(f"Loaded {len(self.coaches_cache)} coaches from cache")
            else:
                # Fetch from backend API
                self.coaches_cache = self._fetch_coaches_from_api()
                
                # Cache the data
                for coach in self.coaches_cache:
                    self.redis_service.set_coach_data(coach.coach_id, coach.dict())
            
            self.last_coach_refresh = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Failed to refresh coach data: {e}")
            # Use existing cache if available
            if not self.coaches_cache:
                self.coaches_cache = self._get_mock_coaches()
    
    def _fetch_coaches_from_api(self) -> List[CoachProfile]:
        """Fetch coaches from backend API"""
        try:
            response = requests.get(
                f"{Config.BACKEND_API_URL}/coaches",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                coaches_data = data.get('data', [])
                
                coaches = []
                for coach_data in coaches_data:
                    try:
                        coach = self._convert_api_coach_to_profile(coach_data)
                        coaches.append(coach)
                    except Exception as e:
                        logger.warning(f"Failed to parse coach data: {e}")
                
                logger.info(f"Fetched {len(coaches)} coaches from API")
                return coaches
            else:
                logger.warning(f"API returned status {response.status_code}")
                return self._get_mock_coaches()
                
        except Exception as e:
            logger.error(f"Failed to fetch coaches from API: {e}")
            return self._get_mock_coaches()
    
    def _convert_api_coach_to_profile(self, coach_data: Dict[str, Any]) -> CoachProfile:
        """Convert API coach data to CoachProfile model"""
        # This method maps the backend API coach format to our internal format
        return CoachProfile(
            coach_id=coach_data.get('id', ''),
            user_id=coach_data.get('userId', ''),
            first_name=coach_data.get('firstName', ''),
            last_name=coach_data.get('lastName', ''),
            email=coach_data.get('email', ''),
            title=coach_data.get('title', ''),
            company=coach_data.get('company', ''),
            bio=coach_data.get('bio', ''),
            skills=[
                {
                    'name': skill.get('subcategory', ''),
                    'level': self._map_experience_level(skill.get('level', 'intermediate')),
                    'years_experience': skill.get('yearsExperience', 0),
                    'certifications': []
                } for skill in coach_data.get('expertise', [])
            ],
            total_experience_years=max([skill.get('yearsExperience', 0) for skill in coach_data.get('expertise', [])], default=0),
            availability=[
                {
                    'day_of_week': avail.get('dayOfWeek', 0),
                    'start_time': avail.get('startTime', '09:00'),
                    'end_time': avail.get('endTime', '17:00'),
                    'timezone': avail.get('timezone', 'UTC')
                } for avail in coach_data.get('availability', [])
            ],
            hourly_rate=coach_data.get('hourlyRate', 100),
            currency=coach_data.get('currency', 'USD'),
            rating=coach_data.get('metrics', {}).get('averageRating', 0.0),
            total_sessions=coach_data.get('metrics', {}).get('totalSessions', 0),
            success_rate=coach_data.get('metrics', {}).get('successRate', 0.0),
            response_time_hours=coach_data.get('metrics', {}).get('responseTime', 24.0),
            languages=coach_data.get('languages', ['English']),
            max_participants=1,  # Default
            session_types=[SessionType.ONE_ON_ONE],  # Default
            is_active=True,
            can_accept_new_clients=True
        )
    
    def _map_experience_level(self, level_str: str) -> ExpertiseLevel:
        """Map string experience level to enum"""
        level_map = {
            'beginner': ExpertiseLevel.BEGINNER,
            'intermediate': ExpertiseLevel.INTERMEDIATE,
            'expert': ExpertiseLevel.EXPERT,
            'master': ExpertiseLevel.MASTER
        }
        return level_map.get(level_str.lower(), ExpertiseLevel.INTERMEDIATE)
    
    def _get_mock_coaches(self) -> List[CoachProfile]:
        """Get mock coaches for development/testing"""
        return [
            CoachProfile(
                coach_id="coach_1",
                user_id="user_1",
                first_name="Sarah",
                last_name="Johnson",
                email="sarah@example.com",
                title="Senior Software Engineer",
                company="Tech Corp",
                bio="Experienced full-stack developer with expertise in React and Node.js",
                skills=[
                    {
                        'name': 'React',
                        'level': ExpertiseLevel.EXPERT,
                        'years_experience': 6,
                        'certifications': ['React Certified Developer']
                    },
                    {
                        'name': 'Node.js',
                        'level': ExpertiseLevel.EXPERT,
                        'years_experience': 5,
                        'certifications': []
                    }
                ],
                total_experience_years=8,
                availability=[
                    {
                        'day_of_week': 1,  # Monday
                        'start_time': '09:00',
                        'end_time': '17:00',
                        'timezone': 'UTC-8'
                    },
                    {
                        'day_of_week': 3,  # Wednesday
                        'start_time': '09:00',
                        'end_time': '17:00',
                        'timezone': 'UTC-8'
                    }
                ],
                hourly_rate=150.0,
                currency="USD",
                rating=4.8,
                total_sessions=127,
                success_rate=0.91,
                response_time_hours=4.0,
                languages=["English", "Spanish"],
                max_participants=5,
                session_types=[SessionType.ONE_ON_ONE, SessionType.GROUP],
                is_active=True,
                can_accept_new_clients=True
            ),
            CoachProfile(
                coach_id="coach_2",
                user_id="user_2",
                first_name="Michael",
                last_name="Chen",
                email="michael@example.com",
                title="Product Manager",
                company="Innovation Labs",
                bio="Product strategy expert with agile methodologies expertise",
                skills=[
                    {
                        'name': 'Product Strategy',
                        'level': ExpertiseLevel.EXPERT,
                        'years_experience': 7,
                        'certifications': ['Certified Product Manager']
                    },
                    {
                        'name': 'Agile',
                        'level': ExpertiseLevel.EXPERT,
                        'years_experience': 6,
                        'certifications': ['Scrum Master']
                    }
                ],
                total_experience_years=10,
                availability=[
                    {
                        'day_of_week': 2,  # Tuesday
                        'start_time': '10:00',
                        'end_time': '18:00',
                        'timezone': 'UTC-8'
                    }
                ],
                hourly_rate=120.0,
                currency="USD",
                rating=4.9,
                total_sessions=89,
                success_rate=0.94,
                response_time_hours=2.0,
                languages=["English", "Mandarin"],
                max_participants=10,
                session_types=[SessionType.GROUP, SessionType.WORKSHOP],
                is_active=True,
                can_accept_new_clients=True
            )
        ]
    
    def _apply_hard_filters(self, coaches: List[CoachProfile], request: MatchingRequest) -> List[CoachProfile]:
        """Apply hard constraints to filter coaches"""
        filtered_coaches = []
        
        for coach in coaches:
            # Check session type compatibility
            if request.session_type not in coach.session_types:
                continue
            
            # Check budget constraints
            if (request.budget_constraints.max_hourly_rate and 
                coach.hourly_rate > request.budget_constraints.max_hourly_rate):
                continue
            
            # Check participant capacity
            if coach.max_participants < request.participants_count:
                continue
            
            # Check language requirements
            if not any(lang in coach.languages for lang in request.preferred_languages):
                continue
            
            # Check availability overlap
            if not self._has_availability_overlap(coach, request):
                continue
            
            filtered_coaches.append(coach)
        
        return filtered_coaches
    
    def _has_availability_overlap(self, coach: CoachProfile, request: MatchingRequest) -> bool:
        """Check if coach availability overlaps with request requirements"""
        request_days = set(request.availability_requirements.days_of_week)
        coach_days = set(avail['day_of_week'] for avail in coach.availability)
        
        # Check if there's any day overlap
        return bool(request_days.intersection(coach_days))
    
    def _calculate_match_score(self, coach: CoachProfile, request: MatchingRequest) -> MatchResult:
        """Calculate comprehensive match score for a coach"""
        
        # Calculate individual scores
        skill_score = self._calculate_skill_score(coach, request)
        experience_score = self._calculate_experience_score(coach, request)
        availability_score = self._calculate_availability_score(coach, request)
        price_score = self._calculate_price_score(coach, request)
        rating_score = self._calculate_rating_score(coach)
        
        # Calculate weighted overall score
        overall_score = (
            skill_score * self.weights['skills'] +
            experience_score * self.weights['experience'] +
            availability_score * self.weights['availability'] +
            price_score * self.weights['price'] +
            rating_score * self.weights['rating']
        )
        
        # Generate match details
        matching_skills = self._get_matching_skills(coach, request)
        missing_skills = self._get_missing_skills(coach, request)
        availability_overlap = self._calculate_availability_overlap(coach, request)
        price_difference = self._calculate_price_difference(coach, request)
        
        # Generate recommendation reason
        recommendation_reason = self._generate_recommendation_reason(
            coach, skill_score, experience_score, rating_score
        )
        
        # Calculate confidence level
        confidence_level = self._calculate_confidence_level(
            skill_score, experience_score, availability_score, coach
        )
        
        return MatchResult(
            coach=coach,
            match_score=min(overall_score, 1.0),
            skill_score=skill_score,
            experience_score=experience_score,
            availability_score=availability_score,
            price_score=price_score,
            rating_score=rating_score,
            matching_skills=matching_skills,
            missing_skills=missing_skills,
            availability_overlap=availability_overlap,
            price_difference_percent=price_difference,
            confidence_level=confidence_level,
            recommendation_reason=recommendation_reason
        )
    
    def _calculate_skill_score(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate skill matching score"""
        if not request.skills_required:
            return 0.5  # Neutral score if no skills specified
        
        total_weight = sum(skill.weight for skill in request.skills_required)
        if total_weight == 0:
            return 0.5
        
        score = 0.0
        for required_skill in request.skills_required:
            # Find matching coach skill
            coach_skill = self._find_coach_skill(coach, required_skill.name)
            
            if coach_skill:
                # Calculate skill level match
                level_score = self._calculate_skill_level_match(
                    coach_skill['level'], required_skill.level
                )
                
                # Consider experience years
                exp_bonus = min(coach_skill['years_experience'] / 5.0, 0.2)
                
                skill_score = min(level_score + exp_bonus, 1.0)
                score += skill_score * required_skill.weight
            elif required_skill.mandatory:
                # Mandatory skill missing - significantly reduce score
                score -= 0.5 * required_skill.weight
        
        return max(score / total_weight, 0.0)
    
    def _find_coach_skill(self, coach: CoachProfile, skill_name: str) -> Optional[Dict[str, Any]]:
        """Find a specific skill in coach's skill set"""
        skill_name_lower = skill_name.lower()
        for skill in coach.skills:
            if skill['name'].lower() == skill_name_lower:
                return skill
        return None
    
    def _calculate_skill_level_match(self, coach_level: ExpertiseLevel, required_level: ExpertiseLevel) -> float:
        """Calculate match score based on skill levels"""
        level_map = {
            ExpertiseLevel.BEGINNER: 1,
            ExpertiseLevel.INTERMEDIATE: 2,
            ExpertiseLevel.EXPERT: 3,
            ExpertiseLevel.MASTER: 4
        }
        
        coach_level_num = level_map.get(coach_level, 2)
        required_level_num = level_map.get(required_level, 2)
        
        if coach_level_num >= required_level_num:
            # Coach exceeds or meets requirement
            return 1.0
        else:
            # Coach is below requirement
            return coach_level_num / required_level_num
    
    def _calculate_experience_score(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate experience matching score"""
        level_map = {
            ExpertiseLevel.BEGINNER: 1,
            ExpertiseLevel.INTERMEDIATE: 3,
            ExpertiseLevel.EXPERT: 6,
            ExpertiseLevel.MASTER: 10
        }
        
        required_years = level_map.get(request.experience_level, 3)
        
        if coach.total_experience_years >= required_years:
            # Calculate bonus for additional experience
            bonus = min((coach.total_experience_years - required_years) / 10.0, 0.3)
            return min(1.0 + bonus, 1.0)
        else:
            # Partial credit for partial experience
            return coach.total_experience_years / required_years
    
    def _calculate_availability_score(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate availability matching score"""
        if not coach.availability or not request.availability_requirements.days_of_week:
            return 0.5
        
        request_days = set(request.availability_requirements.days_of_week)
        coach_days = set(avail['day_of_week'] for avail in coach.availability)
        
        overlap_days = request_days.intersection(coach_days)
        
        if not overlap_days:
            return 0.0
        
        # Calculate overlap ratio
        overlap_ratio = len(overlap_days) / len(request_days)
        
        # Apply flexibility factor
        flexibility_bonus = request.availability_requirements.flexibility * 0.2
        
        return min(overlap_ratio + flexibility_bonus, 1.0)
    
    def _calculate_price_score(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate price compatibility score"""
        if not request.budget_constraints.max_hourly_rate:
            return 0.5  # Neutral if no budget specified
        
        max_rate = request.budget_constraints.max_hourly_rate
        coach_rate = coach.hourly_rate
        
        if coach_rate <= max_rate:
            # Within budget - higher score for better value
            if coach_rate <= max_rate * 0.8:
                return 1.0  # Great value
            else:
                return 0.8  # Acceptable
        else:
            # Over budget - score based on how much over
            overage_ratio = (coach_rate - max_rate) / max_rate
            return max(0.0, 0.5 - overage_ratio)
    
    def _calculate_rating_score(self, coach: CoachProfile) -> float:
        """Calculate rating-based score"""
        if coach.rating == 0:
            return 0.5  # Neutral for new coaches
        
        # Normalize rating (0-5 scale to 0-1 scale)
        base_score = coach.rating / 5.0
        
        # Bonus for high session count (reliability indicator)
        session_bonus = min(coach.total_sessions / 100.0, 0.2)
        
        # Bonus for high success rate
        success_bonus = coach.success_rate * 0.1
        
        return min(base_score + session_bonus + success_bonus, 1.0)
    
    def _get_matching_skills(self, coach: CoachProfile, request: MatchingRequest) -> List[str]:
        """Get list of skills that match between coach and request"""
        matching_skills = []
        
        for required_skill in request.skills_required:
            if self._find_coach_skill(coach, required_skill.name):
                matching_skills.append(required_skill.name)
        
        return matching_skills
    
    def _get_missing_skills(self, coach: CoachProfile, request: MatchingRequest) -> List[str]:
        """Get list of required skills that coach doesn't have"""
        missing_skills = []
        
        for required_skill in request.skills_required:
            if not self._find_coach_skill(coach, required_skill.name):
                missing_skills.append(required_skill.name)
        
        return missing_skills
    
    def _calculate_availability_overlap(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate percentage of availability overlap"""
        if not request.availability_requirements.days_of_week:
            return 0.0
        
        request_days = set(request.availability_requirements.days_of_week)
        coach_days = set(avail['day_of_week'] for avail in coach.availability)
        
        overlap_days = request_days.intersection(coach_days)
        
        return len(overlap_days) / len(request_days) if request_days else 0.0
    
    def _calculate_price_difference(self, coach: CoachProfile, request: MatchingRequest) -> float:
        """Calculate price difference percentage"""
        if not request.budget_constraints.max_hourly_rate:
            return 0.0
        
        max_rate = request.budget_constraints.max_hourly_rate
        return ((coach.hourly_rate - max_rate) / max_rate) * 100
    
    def _generate_recommendation_reason(self, coach: CoachProfile, skill_score: float, 
                                      experience_score: float, rating_score: float) -> str:
        """Generate human-readable recommendation reason"""
        reasons = []
        
        if skill_score > 0.8:
            reasons.append("excellent skill match")
        elif skill_score > 0.6:
            reasons.append("good skill alignment")
        
        if experience_score > 0.8:
            reasons.append("extensive experience")
        
        if rating_score > 0.8:
            reasons.append("highly rated")
        
        if coach.total_sessions > 50:
            reasons.append("proven track record")
        
        if not reasons:
            reasons.append("meets basic requirements")
        
        return f"Recommended for {', '.join(reasons)}"
    
    def _calculate_confidence_level(self, skill_score: float, experience_score: float, 
                                  availability_score: float, coach: CoachProfile) -> float:
        """Calculate confidence level in the match"""
        # Base confidence from key scores
        base_confidence = (skill_score + experience_score + availability_score) / 3
        
        # Boost confidence for established coaches
        if coach.total_sessions > 20:
            base_confidence += 0.1
        
        # Boost for high ratings
        if coach.rating > 4.5:
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def _update_statistics(self, total_coaches: int, matches_found: int, processing_time: int):
        """Update service statistics"""
        self.total_requests_processed += 1
        self.total_matches_generated += matches_found
        
        # Update average processing time
        self.average_processing_time = (
            (self.average_processing_time * (self.total_requests_processed - 1) + processing_time) 
            / self.total_requests_processed
        )
        
        # Store statistics in Redis
        stats = {
            'total_coaches': total_coaches,
            'matches_found': matches_found,
            'processing_time_ms': processing_time,
            'algorithm_version': self.algorithm_version
        }
        
        self.redis_service.store_processing_stats(stats)
    
    def _cache_results(self, request_id: str, results: List[MatchResult]):
        """Cache matching results"""
        try:
            cache_data = {
                'matches': [result.dict() for result in results],
                'generated_at': datetime.utcnow().isoformat(),
                'algorithm_version': self.algorithm_version
            }
            
            self.redis_service.cache_matching_result(request_id, cache_data)
            
        except Exception as e:
            logger.error(f"Failed to cache results: {e}")
    
    def get_all_coaches(self) -> List[CoachProfile]:
        """Get all coaches for external API calls"""
        return self._get_available_coaches()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get service statistics"""
        return {
            'total_requests_processed': self.total_requests_processed,
            'total_matches_generated': self.total_matches_generated,
            'average_processing_time_ms': self.average_processing_time,
            'algorithm_version': self.algorithm_version,
            'cache_info': self.redis_service.get_cache_info(),
            'active_coaches': len(self._get_available_coaches())
        }
    
    def get_last_processing_time(self) -> int:
        """Get last processing time in milliseconds"""
        return self.last_processing_time
    
    def get_algorithm_version(self) -> str:
        """Get algorithm version"""
        return self.algorithm_version
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp as ISO string"""
        return datetime.utcnow().isoformat()
    
    def is_healthy(self) -> bool:
        """Check if matching service is healthy"""
        try:
            # Check if we have coaches available
            coaches = self._get_available_coaches()
            return len(coaches) > 0
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
