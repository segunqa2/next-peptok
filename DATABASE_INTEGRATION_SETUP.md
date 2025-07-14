# Database Integration Setup - Peptok Coaching Platform

## Overview

The Peptok coaching platform now includes complete database persistence and advanced matching service integration. All data is saved and loaded from databases on both the NestJS-style backend and the matching service.

## Backend Architecture

### 1. Integrated Backend Service (`integrated-backend.js`)

**Features:**

- **Database Persistence**: JSON file-based database with automatic save/load
- **Advanced Matching Service**: ML-style algorithm for coach-request matching
- **RESTful API**: Complete CRUD operations for all entities
- **Real-time Matching**: Automatic match generation on request creation

**Database Structure:**

```json
{
  "mentorshipRequests": [],
  "coaches": [],
  "matches": [],
  "companies": [],
  "users": [],
  "sessions": []
}
```

### 2. Database Service Features

**Automatic Persistence:**

- All data automatically saved to `peptok-database.json`
- Graceful shutdown with data preservation
- Error handling and recovery

**CRUD Operations:**

- Create, Read, Update, Delete for all entities
- Optimistic updates with rollback capability
- Timestamp tracking for all operations

## API Endpoints

### Health & Statistics

- `GET /health` - Service health check
- `GET /api/v1/health` - Detailed health with database stats
- `GET /api/v1/stats` - Complete database statistics

### Coaching Requests

- `POST /mentorship-requests` - Create new coaching request
- `GET /mentorship-requests` - Get all requests
- `GET /mentorship-requests/:id` - Get specific request with matches
- `PUT /mentorship-requests/:id` - Update request

### Coaches

- `GET /coaches` - Get all coaches
- `GET /coaches/:id` - Get specific coach
- `POST /coaches` - Add new coach

### Matching Service

- `POST /matching/search` - Generate matches for request
- `GET /matching/requests/:requestId` - Get saved matches for request

## Advanced Matching Algorithm

### Scoring Components

1. **Expertise Alignment (50% weight)**

   - Keyword matching between coach expertise and request requirements
   - Partial matching with fuzzy logic
   - Specialized skill recognition

2. **Experience Level (30% weight)**

   - Years of experience comparison
   - Seniority level matching
   - Domain-specific experience

3. **Client Ratings (20% weight)**
   - Historical performance scores
   - Client satisfaction metrics
   - Success rate indicators

### Match Generation Process

```javascript
const finalScore =
  expertiseScore * 0.5 + experienceScore * 0.3 + ratingScore * 0.2;
```

**Features:**

- Minimum score guarantee (0.3)
- Detailed reasoning for each match
- Sortable by relevance
- Persistent match storage

## Database Persistence

### File-Based Storage

- **Location**: `peptok-database.json` in project root
- **Format**: Pretty-printed JSON for human readability
- **Backup**: Automatic file creation on first run

### Data Integrity

- **Atomic Operations**: Complete transaction or rollback
- **Error Handling**: Graceful degradation on file system errors
- **Validation**: Schema validation for all data types

## Frontend Integration

### Environment Configuration

```bash
# .env.local
VITE_API_URL=http://localhost:3001
VITE_ENABLE_BACKEND=true
VITE_ENVIRONMENT=development
```

### API Service Configuration

- **Base URL**: `http://localhost:3001` (development)
- **Timeout**: 10 seconds
- **Retry Logic**: 3 attempts with exponential backoff
- **Fallback**: localStorage when backend unavailable

## Data Flow

### Coaching Request Creation

1. **Frontend Form** → Validation & submission
2. **API Call** → `POST /mentorship-requests`
3. **Database Save** → Persistent storage
4. **Match Generation** → Automatic coach matching
5. **Match Storage** → Persistent match records
6. **Response** → Request + match count returned

### Coach Matching

1. **Request Analysis** → Extract requirements
2. **Coach Scoring** → Apply matching algorithm
3. **Result Ranking** → Sort by relevance
4. **Database Save** → Store match results
5. **Return Data** → Formatted matches with reasoning

## Testing & Validation

### Backend Startup Validation

```bash
node integrated-backend.js
```

**Expected Output:**

```
🚀 Peptok Integrated API running on http://localhost:3001
📚 Health check: http://localhost:3001/health
📊 Stats: http://localhost:3001/api/v1/stats
💾 Database file: /path/to/peptok-database.json
🔍 Matching service: 4 coaches loaded
```

### Health Check Validation

```bash
curl http://localhost:3001/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "peptok-integrated-api",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "requests": 0,
    "coaches": 4,
    "matches": 0,
    "companies": 0,
    "users": 0,
    "sessions": 0
  },
  "matching": {
    "coaches": 4
  }
}
```

## Sample Coaches Database

The system initializes with 4 sample coaches:

1. **Dr. Sarah Johnson** - Leadership & Strategy Expert
2. **Michael Chen** - Technology & Product Management
3. **Emma Rodriguez** - Marketing & Growth Strategy
4. **David Kim** - Finance & Operations

Each coach includes:

- Unique ID and profile information
- Expertise areas and experience level
- Hourly rates and availability status
- Performance ratings and bio

## Performance Optimizations

### Database Operations

- **Lazy Loading**: Load data only when needed
- **Caching**: In-memory cache for frequent queries
- **Indexing**: Fast lookups by ID and key fields

### Matching Service

- **Parallel Processing**: Multiple coach evaluations
- **Score Caching**: Avoid recalculating same matches
- **Batch Operations**: Process multiple requests efficiently

## Security Features

### Data Protection

- **Input Validation**: All API inputs validated
- **SQL Injection Prevention**: No direct query construction
- **XSS Protection**: All outputs sanitized

### API Security

- **CORS Configuration**: Restricted to frontend domain
- **Rate Limiting**: Prevent abuse (future enhancement)
- **Authentication**: Ready for JWT integration

## Monitoring & Logging

### Request Logging

- All API calls logged with timestamps
- Database operations tracked
- Error conditions recorded

### Performance Metrics

- Response times measured
- Database operation duration
- Matching algorithm performance

## Future Enhancements

### Planned Features

1. **PostgreSQL Integration** - Replace JSON with real database
2. **Redis Caching** - Add distributed caching layer
3. **Machine Learning** - Enhanced matching algorithms
4. **Real-time Updates** - WebSocket integration
5. **Analytics Dashboard** - Usage and performance metrics

## Troubleshooting

### Common Issues

**Backend Not Starting:**

- Check port 3001 availability
- Verify file permissions for database file
- Check Node.js version compatibility

**Database Not Persisting:**

- Verify write permissions in project directory
- Check disk space availability
- Review error logs for file system issues

**Matching Service Errors:**

- Validate request data format
- Check coach data integrity
- Review scoring algorithm inputs

## Development Workflow

### Starting the System

1. Start backend: `node integrated-backend.js`
2. Start frontend: `npm run dev`
3. Verify health checks
4. Test data flow

### Data Management

- **Backup**: Copy `peptok-database.json` before major changes
- **Reset**: Delete database file to start fresh
- **Migration**: Update schema as needed

## Success Metrics

✅ **All data saved to persistent database**
✅ **Advanced matching service with database integration**  
✅ **Complete CRUD operations for all entities**
✅ **Automatic match generation and storage**
✅ **Frontend properly configured for database backend**
✅ **End-to-end data flow tested and validated**

The system now provides complete database persistence for all coaching platform operations with advanced matching capabilities.
