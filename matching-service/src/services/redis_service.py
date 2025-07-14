"""
Redis service for caching coach data and matching results
"""

import json
import logging
import redis
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from src.config.settings import Config

logger = logging.getLogger(__name__)

class RedisService:
    """Redis service for caching and temporary storage"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self._init_client()
    
    def _init_client(self):
        """Initialize Redis client"""
        try:
            self.redis_client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                password=Config.REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            self.redis_client.ping()
            logger.info("Redis client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis client: {e}")
            raise
    
    def get_coach_data(self, coach_id: str) -> Optional[Dict[str, Any]]:
        """Get cached coach data"""
        try:
            cache_key = f"coach:{coach_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for coach {coach_id}")
                return json.loads(cached_data)
            else:
                logger.debug(f"Cache miss for coach {coach_id}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get coach data from cache: {e}")
            return None
    
    def set_coach_data(self, coach_id: str, coach_data: Dict[str, Any], ttl: int = None):
        """Cache coach data"""
        try:
            cache_key = f"coach:{coach_id}"
            ttl = ttl or Config.COACH_DATA_TTL
            
            # Add metadata
            cached_data = {
                'data': coach_data,
                'cached_at': datetime.utcnow().isoformat(),
                'ttl': ttl
            }
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(cached_data, default=str)
            )
            
            logger.debug(f"Cached coach data for {coach_id} (TTL: {ttl}s)")
            
        except Exception as e:
            logger.error(f"Failed to cache coach data: {e}")
    
    def get_all_coaches(self) -> List[Dict[str, Any]]:
        """Get all cached coaches"""
        try:
            coach_keys = self.redis_client.keys("coach:*")
            coaches = []
            
            for key in coach_keys:
                cached_data = self.redis_client.get(key)
                if cached_data:
                    coach_data = json.loads(cached_data)
                    coaches.append(coach_data.get('data', {}))
            
            logger.debug(f"Retrieved {len(coaches)} coaches from cache")
            return coaches
            
        except Exception as e:
            logger.error(f"Failed to get all coaches from cache: {e}")
            return []
    
    def invalidate_coach_cache(self, coach_id: str = None):
        """Invalidate coach cache"""
        try:
            if coach_id:
                # Invalidate specific coach
                cache_key = f"coach:{coach_id}"
                self.redis_client.delete(cache_key)
                logger.info(f"Invalidated cache for coach {coach_id}")
            else:
                # Invalidate all coaches
                coach_keys = self.redis_client.keys("coach:*")
                if coach_keys:
                    self.redis_client.delete(*coach_keys)
                    logger.info(f"Invalidated cache for {len(coach_keys)} coaches")
                
        except Exception as e:
            logger.error(f"Failed to invalidate coach cache: {e}")
    
    def cache_matching_result(self, request_id: str, result: Dict[str, Any], ttl: int = 3600):
        """Cache matching result"""
        try:
            cache_key = f"match_result:{request_id}"
            
            cached_result = {
                'result': result,
                'cached_at': datetime.utcnow().isoformat(),
                'ttl': ttl
            }
            
            self.redis_client.setex(
                cache_key,
                ttl,
                json.dumps(cached_result, default=str)
            )
            
            logger.debug(f"Cached matching result for request {request_id}")
            
        except Exception as e:
            logger.error(f"Failed to cache matching result: {e}")
    
    def get_matching_result(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get cached matching result"""
        try:
            cache_key = f"match_result:{request_id}"
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                result_data = json.loads(cached_data)
                logger.debug(f"Cache hit for matching result {request_id}")
                return result_data.get('result')
            else:
                logger.debug(f"Cache miss for matching result {request_id}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get matching result from cache: {e}")
            return None
    
    def store_processing_stats(self, stats: Dict[str, Any]):
        """Store processing statistics"""
        try:
            # Use sorted set for time-series data
            timestamp = datetime.utcnow().timestamp()
            stats_key = "processing_stats"
            
            # Store stats with timestamp
            stats_data = {
                'timestamp': timestamp,
                **stats
            }
            
            self.redis_client.zadd(
                stats_key,
                {json.dumps(stats_data, default=str): timestamp}
            )
            
            # Keep only last 1000 entries
            self.redis_client.zremrangebyrank(stats_key, 0, -1001)
            
            logger.debug("Stored processing statistics")
            
        except Exception as e:
            logger.error(f"Failed to store processing stats: {e}")
    
    def get_processing_stats(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get processing statistics for the last N hours"""
        try:
            stats_key = "processing_stats"
            
            # Calculate time range
            end_time = datetime.utcnow().timestamp()
            start_time = end_time - (hours * 3600)
            
            # Get stats in time range
            stats_data = self.redis_client.zrangebyscore(
                stats_key, start_time, end_time
            )
            
            stats_list = []
            for data in stats_data:
                try:
                    stats_list.append(json.loads(data))
                except json.JSONDecodeError:
                    continue
            
            logger.debug(f"Retrieved {len(stats_list)} processing stats")
            return stats_list
            
        except Exception as e:
            logger.error(f"Failed to get processing stats: {e}")
            return []
    
    def increment_counter(self, key: str, amount: int = 1) -> int:
        """Increment a counter"""
        try:
            return self.redis_client.incr(key, amount)
        except Exception as e:
            logger.error(f"Failed to increment counter {key}: {e}")
            return 0
    
    def get_counter(self, key: str) -> int:
        """Get counter value"""
        try:
            value = self.redis_client.get(key)
            return int(value) if value else 0
        except Exception as e:
            logger.error(f"Failed to get counter {key}: {e}")
            return 0
    
    def set_flag(self, key: str, value: bool = True, ttl: int = None):
        """Set a boolean flag"""
        try:
            if ttl:
                self.redis_client.setex(key, ttl, "1" if value else "0")
            else:
                self.redis_client.set(key, "1" if value else "0")
        except Exception as e:
            logger.error(f"Failed to set flag {key}: {e}")
    
    def get_flag(self, key: str) -> bool:
        """Get boolean flag"""
        try:
            value = self.redis_client.get(key)
            return value == "1" if value else False
        except Exception as e:
            logger.error(f"Failed to get flag {key}: {e}")
            return False
    
    def is_healthy(self) -> bool:
        """Check if Redis service is healthy"""
        try:
            if not self.redis_client:
                return False
            
            # Test with ping
            self.redis_client.ping()
            return True
            
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    def clear_all_cache(self):
        """Clear all cache (use with caution)"""
        try:
            self.redis_client.flushdb()
            logger.warning("All cache data has been cleared")
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get cache information and statistics"""
        try:
            info = self.redis_client.info()
            
            # Get key counts by pattern
            coach_count = len(self.redis_client.keys("coach:*"))
            match_count = len(self.redis_client.keys("match_result:*"))
            
            return {
                'redis_version': info.get('redis_version'),
                'used_memory': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'cache_counts': {
                    'coaches': coach_count,
                    'match_results': match_count
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get cache info: {e}")
            return {}
