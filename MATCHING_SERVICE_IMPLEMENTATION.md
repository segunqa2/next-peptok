# Coach Matching Service Implementation

This document describes the implementation of a Flask-based Python matching service that integrates with Kafka for asynchronous coach-to-request matching.

## Architecture Overview

```
Frontend (React/TS)
    ↓ HTTP Request
Backend (Node.js/TS)
    ↓ Kafka Message
Kafka Message Broker
    ↓ Consumer
Matching Service (Python/Flask)
    ↓ ML Algorithm + Business Rules
Redis Cache (Coach Data)
    ↓ Kafka Response
Backend (Node.js/TS)
    ↓ HTTP Response
Frontend (React/TS)
```

## Components

### 1. Python Matching Service (`matching-service/`)

**Technology Stack:**

- Flask 3.0 (Web framework)
- Kafka-python & Confluent-kafka (Message processing)
- Redis (Caching)
- Scikit-learn (Machine learning)
- Pandas & NumPy (Data processing)
- Pydantic (Data validation)

**Key Features:**

- Intelligent coach-to-request matching algorithm
- Real-time Kafka message processing
- Redis caching for performance
- ML-powered similarity scoring
- RESTful API for testing and monitoring

### 2. Kafka Integration

**Topics:**

- `matching-requests` - Incoming matching requests from backend
- `matching-responses` - Matching results sent back to backend
- `matching-errors` - Error messages and failed requests

**Message Flow:**

1. Backend receives matching request from frontend
2. Backend publishes request to `matching-requests` topic
3. Matching service consumes request and processes it
4. Matching service publishes results to `matching-responses` topic
5. Backend consumes response and serves to frontend

### 3. Backend Integration (Node.js/TypeScript)

**New Services:**

- `KafkaIntegrationService` - Handles Kafka communication
- `/api/matching/*` routes - RESTful endpoints for matching

**Dependencies Added:**

- `kafkajs` - Kafka client library
- `@types/kafkajs` - TypeScript definitions

## Matching Algorithm

### Scoring Components

The matching algorithm uses weighted scoring across five dimensions:

1. **Skill Match (30%)** - Measures compatibility between required and coach skills
2. **Experience Level (25%)** - Evaluates coach experience vs requirements
3. **Rating Score (20%)** - Considers coach ratings and track record
4. **Availability (15%)** - Checks schedule compatibility
5. **Price Compatibility (10%)** - Compares rates with budget constraints

### Algorithm Process

```python
def find_matches(request: MatchingRequest) -> List[MatchResult]:
    1. Load available coaches from cache/API
    2. Apply hard filters (budget, availability, session type)
    3. Calculate weighted scores for each coach
    4. Sort by overall match score
    5. Return top N matches (configurable, default 10)
```

### Hard Filters

Before scoring, coaches are filtered by:

- Session type compatibility
- Budget constraints (max hourly rate)
- Participant capacity
- Language requirements
- Basic availability overlap

### Soft Scoring

Each coach receives scores (0.0-1.0) for:

- **Skill matching**: Exact matches, experience years, certifications
- **Experience**: Years vs required level, additional expertise bonus
- **Ratings**: Average rating, session count, success rate
- **Availability**: Schedule overlap percentage, flexibility factor
- **Price**: Value proposition, budget fit

## API Endpoints

### Backend Endpoints

#### POST `/api/matching/request`

Submit a new coach matching request.

```typescript
{
  "title": "React Development Training",
  "description": "Need experienced React coach for team training",
  "session_type": "group",
  "skills_required": [
    {
      "name": "React",
      "level": "expert",
      "weight": 1.0,
      "mandatory": true
    }
  ],
  "budget_constraints": {
    "max_hourly_rate": 150,
    "currency": "USD"
  },
  "availability_requirements": {
    "days_of_week": [1, 2, 3],
    "time_slots": ["09:00-17:00"],
    "timezone": "UTC-8"
  },
  "participants_count": 5,
  "total_sessions": 8
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "request_id": "match_1703123456789_abc123",
    "status": "pending",
    "estimated_processing_time": "10-30 seconds"
  }
}
```

#### GET `/api/matching/results/:requestId`

Get matching results for a specific request.

**Response:**

```json
{
  "success": true,
  "data": {
    "request_id": "match_1703123456789_abc123",
    "status": "completed",
    "matches": [
      {
        "coach": {
          /* coach profile */
        },
        "match_score": 0.92,
        "skill_score": 0.95,
        "experience_score": 0.88,
        "availability_score": 1.0,
        "price_score": 0.85,
        "rating_score": 0.92,
        "matching_skills": ["React", "JavaScript"],
        "missing_skills": [],
        "confidence_level": 0.89,
        "recommendation_reason": "Excellent skill match with proven track record"
      }
    ],
    "total_matches": 5,
    "processing_time_ms": 1247
  }
}
```

#### GET `/api/matching/history`

Get matching request history for the authenticated user.

### Matching Service Endpoints

#### GET `/health`

Health check endpoint.

#### POST `/api/match`

Manual matching endpoint for testing.

#### GET `/api/coaches`

Get all available coaches.

#### GET `/api/stats`

Get service statistics and metrics.

## Configuration

### Environment Variables

**Backend (.env):**

```bash
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
REDIS_HOST=redis
```

**Matching Service (.env):**

```bash
FLASK_ENV=development
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
REDIS_HOST=redis
BACKEND_API_URL=http://backend:3001/api

# Algorithm tuning
MAX_MATCHES_PER_REQUEST=10
MIN_MATCH_SCORE=0.6
SKILL_MATCH_WEIGHT=0.3
EXPERIENCE_WEIGHT=0.25
RATING_WEIGHT=0.2
AVAILABILITY_WEIGHT=0.15
PRICE_WEIGHT=0.1
```

### Docker Compose

The docker-compose.yml now includes:

- Zookeeper (Kafka dependency)
- Kafka broker
- Redis cache
- Python matching service

## Data Models

### MatchingRequest (Pydantic)

- Basic request info (title, description, type, priority)
- Skills requirements with levels and weights
- Budget constraints and payment preferences
- Availability requirements with flexibility
- Participant count and session details

### CoachProfile (Pydantic)

- Basic profile info (name, title, company, bio)
- Skills with expertise levels and experience years
- Availability slots with timezones
- Pricing and currency information
- Ratings, metrics, and performance data

### MatchResult (Pydantic)

- Complete coach profile
- Detailed scoring breakdown
- Matching analysis (skills, availability overlap)
- Confidence metrics and recommendations

## Caching Strategy

### Redis Usage

1. **Coach Data Cache**

   - TTL: 1 hour (configurable)
   - Refresh: Every 30 minutes
   - Fallback: API calls or mock data

2. **Matching Results Cache**

   - TTL: 1 hour
   - Key: `match_result:{request_id}`
   - Improves response time for duplicate requests

3. **Statistics Storage**
   - Processing metrics in time-series format
   - Performance monitoring data
   - Service health indicators

## Performance Metrics

### Expected Performance

- **Cold start**: < 2 seconds (cache miss)
- **Warm requests**: < 500ms (cache hit)
- **Processing**: 10-30 seconds for complex requests
- **Throughput**: 100+ requests/minute

### Monitoring

- Request processing times
- Cache hit/miss ratios
- Kafka message lag
- Algorithm accuracy metrics

## Deployment

### Development

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f matching-service
```

### Production

- Multi-stage Docker builds
- Gunicorn with multiple workers
- Kafka clustering for reliability
- Redis clustering for scale
- Health checks and monitoring

## Error Handling

### Failure Scenarios

1. **Kafka unavailable**: Graceful degradation, retry logic
2. **Redis down**: Direct API calls, no caching
3. **Backend API fails**: Use mock/cached coach data
4. **Algorithm errors**: Return partial results with warnings

### Error Topics

- `matching-errors` topic for failed requests
- Structured error responses with codes
- Automatic retry for transient failures

## Testing

### Unit Tests

```bash
cd matching-service
python -m pytest tests/
```

### Integration Tests

- Kafka message flow testing
- End-to-end matching scenarios
- Performance benchmarking

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test manual matching
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{"request_id": "test", ...}'
```

## Future Enhancements

### ML Improvements

- Feedback learning from successful matches
- A/B testing for algorithm variants
- Collaborative filtering based on user behavior
- Natural language processing for skill extraction

### Scalability

- Horizontal scaling with multiple matching service instances
- Kafka partitioning for parallel processing
- Machine learning model serving with MLflow
- Real-time coach availability updates

### Features

- Coach recommendation explanations
- Matching confidence intervals
- Historical matching analytics
- Integration with calendar systems

## Monitoring & Observability

### Metrics

- Request volume and processing times
- Match quality scores and user feedback
- Service availability and error rates
- Cache performance and hit ratios

### Logging

- Structured JSON logs with correlation IDs
- Request tracing across services
- Performance profiling data
- Business metrics and KPIs

### Alerting

- Kafka lag monitoring
- Service health checks
- Algorithm performance degradation
- Cache and database connectivity

This implementation provides a robust, scalable foundation for intelligent coach matching with room for continuous improvement through machine learning and user feedback.
