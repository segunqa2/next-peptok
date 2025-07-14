#!/usr/bin/env python3
"""
Peptok Matching Service
Advanced coach-to-request matching using machine learning and business rules
"""

import json
import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any
import math

class MatchingDatabase:
    def __init__(self, db_path="matching_database.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS coaches (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                expertise TEXT,
                experience TEXT,
                rating REAL,
                bio TEXT,
                hourly_rate INTEGER,
                availability TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS coaching_requests (
                id TEXT PRIMARY KEY,
                title TEXT,
                description TEXT,
                company_id TEXT,
                status TEXT,
                expertise_required TEXT,
                experience_level TEXT,
                budget_range TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                coach_id TEXT,
                request_id TEXT,
                match_score REAL,
                reason TEXT,
                created_at TEXT,
                FOREIGN KEY (coach_id) REFERENCES coaches (id),
                FOREIGN KEY (request_id) REFERENCES coaching_requests (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print(f"📁 Matching database initialized: {self.db_path}")
    
    def save_coach(self, coach_data: Dict[str, Any]):
        """Save coach to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO coaches 
            (id, name, expertise, experience, rating, bio, hourly_rate, availability, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            coach_data['id'],
            coach_data['name'],
            json.dumps(coach_data.get('expertise', [])),
            coach_data.get('experience', ''),
            coach_data.get('rating', 0.0),
            coach_data.get('bio', ''),
            coach_data.get('hourlyRate', 0),
            coach_data.get('availability', 'Unknown'),
            coach_data.get('createdAt', datetime.now().isoformat()),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_coaches(self) -> List[Dict[str, Any]]:
        """Get all coaches from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM coaches')
        rows = cursor.fetchall()
        
        coaches = []
        for row in rows:
            coaches.append({
                'id': row[0],
                'name': row[1],
                'expertise': json.loads(row[2]) if row[2] else [],
                'experience': row[3],
                'rating': row[4],
                'bio': row[5],
                'hourlyRate': row[6],
                'availability': row[7],
                'createdAt': row[8],
                'updatedAt': row[9]
            })
        
        conn.close()
        return coaches
    
    def save_match(self, match_data: Dict[str, Any]):
        """Save match to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO matches 
            (id, coach_id, request_id, match_score, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            match_data['id'],
            match_data['coachId'],
            match_data['requestId'],
            match_data['matchScore'],
            match_data['reason'],
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()

class AdvancedMatchingService:
    def __init__(self):
        self.db = MatchingDatabase()
        self.initialize_sample_data()
    
    def initialize_sample_data(self):
        """Initialize with sample coaches"""
        sample_coaches = [
            {
                'id': 'coach_1',
                'name': 'Dr. Sarah Johnson',
                'expertise': ['Leadership', 'Strategy', 'Team Building', 'Executive Coaching'],
                'experience': '15+ years',
                'rating': 4.9,
                'bio': 'Former Fortune 500 executive with extensive leadership experience.',
                'hourlyRate': 200,
                'availability': 'Available',
                'createdAt': datetime.now().isoformat()
            },
            {
                'id': 'coach_2', 
                'name': 'Michael Chen',
                'expertise': ['Technology', 'Innovation', 'Product Management', 'Agile'],
                'experience': '12+ years',
                'rating': 4.8,
                'bio': 'Ex-Tech lead at major tech companies, specializing in product strategy.',
                'hourlyRate': 180,
                'availability': 'Available',
                'createdAt': datetime.now().isoformat()
            },
            {
                'id': 'coach_3',
                'name': 'Emma Rodriguez',
                'expertise': ['Marketing', 'Sales', 'Customer Success', 'Growth Strategy'],
                'experience': '10+ years',
                'rating': 4.7,
                'bio': 'Marketing executive with proven track record in scaling startups.',
                'hourlyRate': 160,
                'availability': 'Available',
                'createdAt': datetime.now().isoformat()
            }
        ]
        
        for coach in sample_coaches:
            self.db.save_coach(coach)
    
    def calculate_expertise_score(self, coach_expertise: List[str], required_expertise: List[str]) -> float:
        """Calculate expertise alignment score"""
        if not required_expertise or not coach_expertise:
            return 0.3
        
        matches = 0
        for req_skill in required_expertise:
            for coach_skill in coach_expertise:
                if req_skill.lower() in coach_skill.lower() or coach_skill.lower() in req_skill.lower():
                    matches += 1
                    break
        
        return min(matches / len(required_expertise), 1.0)
    
    def calculate_experience_score(self, coach_experience: str, required_level: str) -> float:
        """Calculate experience level alignment"""
        try:
            coach_years = int(''.join(filter(str.isdigit, coach_experience)))
            required_years = int(''.join(filter(str.isdigit, required_level))) if required_level else 5
            
            if coach_years >= required_years:
                return 1.0
            else:
                return coach_years / required_years
        except:
            return 0.5
    
    def calculate_rating_score(self, rating: float) -> float:
        """Calculate rating contribution to score"""
        return min(rating / 5.0, 1.0)
    
    def generate_matches(self, request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate matches for a coaching request"""
        coaches = self.db.get_coaches()
        matches = []
        
        required_expertise = request_data.get('expertise', [])
        required_experience = request_data.get('experience', '5+ years')
        request_id = request_data.get('id', f"request_{int(datetime.now().timestamp())}")
        
        for coach in coaches:
            # Calculate individual scores
            expertise_score = self.calculate_expertise_score(coach['expertise'], required_expertise)
            experience_score = self.calculate_experience_score(coach['experience'], required_experience)
            rating_score = self.calculate_rating_score(coach['rating'])
            
            # Weighted final score
            final_score = (
                expertise_score * 0.5 +  # 50% weight on expertise
                experience_score * 0.3 + # 30% weight on experience
                rating_score * 0.2       # 20% weight on rating
            )
            
            # Ensure minimum score of 0.3
            final_score = max(final_score, 0.3)
            
            # Generate reason
            reason_parts = []
            if expertise_score > 0.7:
                reason_parts.append("Strong expertise alignment")
            if experience_score > 0.8:
                reason_parts.append("Excellent experience match")
            if rating_score > 0.9:
                reason_parts.append("Outstanding client ratings")
            
            reason = ", ".join(reason_parts) if reason_parts else f"{int(final_score * 100)}% overall compatibility"
            
            match = {
                'id': f"match_{int(datetime.now().timestamp())}_{coach['id']}",
                'coachId': coach['id'],
                'requestId': request_id,
                'matchScore': round(final_score, 2),
                'reason': reason,
                'coach': coach,
                'createdAt': datetime.now().isoformat(),
                'scores': {
                    'expertise': round(expertise_score, 2),
                    'experience': round(experience_score, 2),
                    'rating': round(rating_score, 2)
                }
            }
            
            matches.append(match)
            
            # Save match to database
            self.db.save_match(match)
        
        # Sort by score descending
        matches.sort(key=lambda x: x['matchScore'], reverse=True)
        
        print(f"🔍 Generated {len(matches)} matches for request {request_id}")
        return matches

# Simple HTTP server simulation
def run_matching_service():
    matching_service = AdvancedMatchingService()
    
    # Simulate API endpoints
    def handle_matching_request(request_data):
        """Handle matching request"""
        try:
            matches = matching_service.generate_matches(request_data)
            return {
                'status': 'success',
                'data': matches,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_service_health():
        """Get service health status"""
        coaches = matching_service.db.get_coaches()
        return {
            'status': 'ok',
            'service': 'peptok-matching-service',
            'timestamp': datetime.now().isoformat(),
            'database': {
                'coaches': len(coaches),
                'dbPath': matching_service.db.db_path
            }
        }
    
    # Print service information
    print("🚀 Peptok Matching Service initialized")
    print(f"📁 Database: {matching_service.db.db_path}")
    print(f"👥 Coaches loaded: {len(matching_service.db.get_coaches())}")
    
    # Test matching
    test_request = {
        'id': 'test_request_001',
        'expertise': ['Leadership', 'Strategy'],
        'experience': '10+ years'
    }
    
    test_matches = handle_matching_request(test_request)
    print(f"🧪 Test matching: {test_matches['status']}")
    if test_matches['status'] == 'success':
        print(f"📊 Test matches found: {len(test_matches['data'])}")
        for match in test_matches['data'][:2]:  # Show top 2
            print(f"   • {match['coach']['name']}: {match['matchScore']:.2f} - {match['reason']}")
    
    return matching_service, handle_matching_request, get_service_health

if __name__ == "__main__":
    service, handler, health = run_matching_service()
    print("\n✅ Matching service ready for integration!")
