"""
Configuration settings for the matching service
"""

import os
from typing import List, Dict, Any

class Config:
    """Configuration class for the matching service"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_ENV') == 'development'
    
    # Kafka settings
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092')
    KAFKA_REQUEST_TOPIC = os.getenv('KAFKA_REQUEST_TOPIC', 'matching-requests')
    KAFKA_RESPONSE_TOPIC = os.getenv('KAFKA_RESPONSE_TOPIC', 'matching-responses')
    KAFKA_ERROR_TOPIC = os.getenv('KAFKA_ERROR_TOPIC', 'matching-errors')
    KAFKA_CONSUMER_GROUP = os.getenv('KAFKA_CONSUMER_GROUP', 'matching-service')
    
    # Redis settings
    REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')
    
    # Matching algorithm settings
    MATCHING_ALGORITHM_VERSION = '1.0.0'
    MAX_MATCHES_PER_REQUEST = int(os.getenv('MAX_MATCHES_PER_REQUEST', 10))
    MIN_MATCH_SCORE = float(os.getenv('MIN_MATCH_SCORE', 0.6))
    
    # Weight configurations for matching algorithm
    SKILL_MATCH_WEIGHT = float(os.getenv('SKILL_MATCH_WEIGHT', 0.3))
    EXPERIENCE_WEIGHT = float(os.getenv('EXPERIENCE_WEIGHT', 0.25))
    RATING_WEIGHT = float(os.getenv('RATING_WEIGHT', 0.2))
    AVAILABILITY_WEIGHT = float(os.getenv('AVAILABILITY_WEIGHT', 0.15))
    PRICE_WEIGHT = float(os.getenv('PRICE_WEIGHT', 0.1))
    
    # Coach data settings
    COACH_DATA_TTL = int(os.getenv('COACH_DATA_TTL', 3600))  # 1 hour
    REFRESH_COACH_DATA_INTERVAL = int(os.getenv('REFRESH_COACH_DATA_INTERVAL', 1800))  # 30 minutes
    
    # External service URLs
    BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://backend:3001/api')
    
    # Logging settings
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    @classmethod
    def get_matching_weights(cls) -> Dict[str, float]:
        """Get normalized matching weights"""
        weights = {
            'skills': cls.SKILL_MATCH_WEIGHT,
            'experience': cls.EXPERIENCE_WEIGHT,
            'rating': cls.RATING_WEIGHT,
            'availability': cls.AVAILABILITY_WEIGHT,
            'price': cls.PRICE_WEIGHT
        }
        
        # Normalize weights to sum to 1.0
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight for k, v in weights.items()}
        
        return weights
    
    @classmethod
    def validate_config(cls) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []
        
        # Check required environment variables
        required_vars = [
            'KAFKA_BOOTSTRAP_SERVERS',
            'REDIS_HOST'
        ]
        
        for var in required_vars:
            if not os.getenv(var):
                errors.append(f"Missing required environment variable: {var}")
        
        # Validate weight ranges
        weights = [
            cls.SKILL_MATCH_WEIGHT,
            cls.EXPERIENCE_WEIGHT,
            cls.RATING_WEIGHT,
            cls.AVAILABILITY_WEIGHT,
            cls.PRICE_WEIGHT
        ]
        
        for weight in weights:
            if not 0 <= weight <= 1:
                errors.append(f"Weight values must be between 0 and 1")
                break
        
        return errors

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    LOG_LEVEL = 'INFO'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    REDIS_DB = 1  # Use different Redis DB for testing
    KAFKA_CONSUMER_GROUP = 'matching-service-test'

# Configuration mapping
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(env_name: str = None) -> Config:
    """Get configuration based on environment"""
    if env_name is None:
        env_name = os.getenv('FLASK_ENV', 'default')
    
    return config_map.get(env_name, config_map['default'])
