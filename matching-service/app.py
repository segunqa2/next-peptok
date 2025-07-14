#!/usr/bin/env python3
"""
Peptok Coach Matching Service

A Flask-based microservice that provides intelligent coach-to-request matching
using machine learning algorithms and business rules. Integrates with Kafka
for asynchronous communication with the main backend.
"""

import os
import logging
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from src.services.kafka_service import KafkaService
from src.services.matching_service import MatchingService
from src.services.redis_service import RedisService
from src.models.request_models import MatchingRequest, MatchingResponse
from src.config.settings import Config

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize services
    kafka_service = KafkaService()
    matching_service = MatchingService()
    redis_service = RedisService()
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            # Check Kafka connection
            kafka_status = kafka_service.is_healthy()
            
            # Check Redis connection
            redis_status = redis_service.is_healthy()
            
            # Check service status
            service_status = matching_service.is_healthy()
            
            return jsonify({
                'status': 'healthy' if all([kafka_status, redis_status, service_status]) else 'unhealthy',
                'services': {
                    'kafka': 'healthy' if kafka_status else 'unhealthy',
                    'redis': 'healthy' if redis_status else 'unhealthy',
                    'matching': 'healthy' if service_status else 'unhealthy'
                },
                'version': '1.0.0',
                'timestamp': matching_service.get_current_timestamp()
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500
    
    @app.route('/api/match', methods=['POST'])
    def manual_match():
        """Manual matching endpoint for testing"""
        try:
            data = request.get_json()
            
            # Validate request
            matching_request = MatchingRequest(**data)
            
            # Perform matching
            matches = matching_service.find_matches(matching_request)
            
            # Create response
            response = MatchingResponse(
                request_id=matching_request.request_id,
                matches=matches,
                processing_time_ms=matching_service.get_last_processing_time(),
                algorithm_version=matching_service.get_algorithm_version()
            )
            
            return jsonify(response.dict()), 200
            
        except Exception as e:
            logger.error(f"Manual matching failed: {e}")
            return jsonify({
                'error': 'Matching failed',
                'message': str(e)
            }), 500
    
    @app.route('/api/coaches', methods=['GET'])
    def get_coaches():
        """Get all available coaches"""
        try:
            coaches = matching_service.get_all_coaches()
            return jsonify({
                'coaches': [coach.dict() for coach in coaches],
                'count': len(coaches)
            }), 200
        except Exception as e:
            logger.error(f"Failed to get coaches: {e}")
            return jsonify({
                'error': 'Failed to retrieve coaches',
                'message': str(e)
            }), 500
    
    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get matching service statistics"""
        try:
            stats = matching_service.get_statistics()
            return jsonify(stats), 200
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return jsonify({
                'error': 'Failed to retrieve statistics',
                'message': str(e)
            }), 500
    
    # Start Kafka consumer in background thread
    def start_kafka_consumer():
        """Start Kafka consumer in background"""
        try:
            kafka_service.start_consumer(
                topic=Config.KAFKA_REQUEST_TOPIC,
                callback=lambda message: handle_matching_request(
                    message, matching_service, kafka_service
                )
            )
        except Exception as e:
            logger.error(f"Kafka consumer failed: {e}")
    
    # Start background thread for Kafka consumer
    consumer_thread = threading.Thread(target=start_kafka_consumer, daemon=True)
    consumer_thread.start()
    logger.info("Kafka consumer started in background thread")
    
    return app

def handle_matching_request(message, matching_service, kafka_service):
    """Handle incoming matching request from Kafka"""
    try:
        logger.info(f"Processing matching request: {message.get('request_id')}")
        
        # Parse request
        matching_request = MatchingRequest(**message)
        
        # Perform matching
        matches = matching_service.find_matches(matching_request)
        
        # Create response
        response = MatchingResponse(
            request_id=matching_request.request_id,
            matches=matches,
            processing_time_ms=matching_service.get_last_processing_time(),
            algorithm_version=matching_service.get_algorithm_version(),
            timestamp=matching_service.get_current_timestamp()
        )
        
        # Publish response to Kafka
        kafka_service.publish_response(
            topic=Config.KAFKA_RESPONSE_TOPIC,
            response=response.dict()
        )
        
        logger.info(f"Matching completed for request {matching_request.request_id}: {len(matches)} matches found")
        
    except Exception as e:
        logger.error(f"Failed to process matching request: {e}")
        
        # Send error response
        error_response = {
            'request_id': message.get('request_id', 'unknown'),
            'error': 'Matching failed',
            'message': str(e),
            'timestamp': matching_service.get_current_timestamp()
        }
        
        kafka_service.publish_response(
            topic=Config.KAFKA_ERROR_TOPIC,
            response=error_response
        )

if __name__ == '__main__':
    app = create_app()
    
    # Development server
    if os.getenv('FLASK_ENV') == 'development':
        app.run(
            host='0.0.0.0',
            port=int(os.getenv('PORT', 5000)),
            debug=True
        )
    else:
        # Production server (use gunicorn)
        import gunicorn.app.wsgiapp as wsgi
        sys.argv = [
            'gunicorn',
            '--bind', f"0.0.0.0:{os.getenv('PORT', 5000)}",
            '--workers', '4',
            '--timeout', '120',
            'app:create_app()'
        ]
        wsgi.run()
