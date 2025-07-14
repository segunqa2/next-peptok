"""
Kafka service for asynchronous communication with the backend
"""

import json
import logging
import threading
from typing import Callable, Dict, Any, Optional
from confluent_kafka import Consumer, Producer, KafkaError, KafkaException
from confluent_kafka.admin import AdminClient, NewTopic
from src.config.settings import Config

logger = logging.getLogger(__name__)

class KafkaService:
    """Kafka service for handling messaging between services"""
    
    def __init__(self):
        self.consumer: Optional[Consumer] = None
        self.producer: Optional[Producer] = None
        self.admin_client: Optional[AdminClient] = None
        self.is_running = False
        self._init_clients()
    
    def _init_clients(self):
        """Initialize Kafka clients"""
        try:
            # Kafka configuration
            kafka_config = {
                'bootstrap.servers': Config.KAFKA_BOOTSTRAP_SERVERS,
                'client.id': 'matching-service',
                'enable.auto.commit': True,
                'auto.offset.reset': 'latest',
                'group.id': Config.KAFKA_CONSUMER_GROUP,
                'session.timeout.ms': 30000,
                'heartbeat.interval.ms': 10000,
            }
            
            # Initialize consumer
            self.consumer = Consumer(kafka_config)
            
            # Initialize producer
            producer_config = {
                'bootstrap.servers': Config.KAFKA_BOOTSTRAP_SERVERS,
                'client.id': 'matching-service-producer',
                'acks': 'all',
                'retries': 3,
                'retry.backoff.ms': 1000,
            }
            self.producer = Producer(producer_config)
            
            # Initialize admin client
            admin_config = {
                'bootstrap.servers': Config.KAFKA_BOOTSTRAP_SERVERS,
                'client.id': 'matching-service-admin'
            }
            self.admin_client = AdminClient(admin_config)
            
            logger.info("Kafka clients initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Kafka clients: {e}")
            raise
    
    def ensure_topics_exist(self):
        """Ensure required Kafka topics exist"""
        try:
            # Define topics
            topics = [
                NewTopic(
                    topic=Config.KAFKA_REQUEST_TOPIC,
                    num_partitions=3,
                    replication_factor=1
                ),
                NewTopic(
                    topic=Config.KAFKA_RESPONSE_TOPIC,
                    num_partitions=3,
                    replication_factor=1
                ),
                NewTopic(
                    topic=Config.KAFKA_ERROR_TOPIC,
                    num_partitions=1,
                    replication_factor=1
                ),
            ]
            
            # Check existing topics
            topic_metadata = self.admin_client.list_topics(timeout=10)
            existing_topics = set(topic_metadata.topics.keys())
            
            # Create missing topics
            topics_to_create = [
                topic for topic in topics 
                if topic.topic not in existing_topics
            ]
            
            if topics_to_create:
                fs = self.admin_client.create_topics(topics_to_create)
                
                # Wait for topic creation
                for topic, f in fs.items():
                    try:
                        f.result()  # The result itself is None
                        logger.info(f"Topic {topic} created successfully")
                    except Exception as e:
                        logger.error(f"Failed to create topic {topic}: {e}")
            else:
                logger.info("All required topics already exist")
                
        except Exception as e:
            logger.error(f"Failed to ensure topics exist: {e}")
            raise
    
    def start_consumer(self, topic: str, callback: Callable[[Dict[str, Any]], None]):
        """Start consuming messages from a topic"""
        try:
            if not self.consumer:
                raise Exception("Consumer not initialized")
            
            # Ensure topics exist
            self.ensure_topics_exist()
            
            # Subscribe to topic
            self.consumer.subscribe([topic])
            self.is_running = True
            
            logger.info(f"Started consuming from topic: {topic}")
            
            while self.is_running:
                try:
                    # Poll for messages
                    msg = self.consumer.poll(timeout=1.0)
                    
                    if msg is None:
                        continue
                    
                    if msg.error():
                        if msg.error().code() == KafkaError._PARTITION_EOF:
                            logger.debug(f"Reached end of partition {msg.partition()}")
                        else:
                            logger.error(f"Consumer error: {msg.error()}")
                        continue
                    
                    # Process message
                    try:
                        message_data = json.loads(msg.value().decode('utf-8'))
                        logger.info(f"Received message: {message_data.get('request_id', 'unknown')}")
                        
                        # Call the callback function
                        callback(message_data)
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode message: {e}")
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                
                except KafkaException as e:
                    logger.error(f"Kafka exception: {e}")
                    
        except Exception as e:
            logger.error(f"Consumer failed: {e}")
            raise
        finally:
            if self.consumer:
                self.consumer.close()
    
    def publish_response(self, topic: str, response: Dict[str, Any]):
        """Publish response to a topic"""
        try:
            if not self.producer:
                raise Exception("Producer not initialized")
            
            # Serialize response
            message = json.dumps(response, default=str)
            
            # Produce message
            self.producer.produce(
                topic=topic,
                value=message.encode('utf-8'),
                key=str(response.get('request_id', '')).encode('utf-8'),
                callback=self._delivery_callback
            )
            
            # Trigger delivery
            self.producer.flush(timeout=10)
            
            logger.info(f"Published response to topic {topic}: {response.get('request_id', 'unknown')}")
            
        except Exception as e:
            logger.error(f"Failed to publish response: {e}")
            raise
    
    def _delivery_callback(self, err, msg):
        """Callback for message delivery confirmation"""
        if err:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")
    
    def stop_consumer(self):
        """Stop the consumer"""
        self.is_running = False
        logger.info("Consumer stop requested")
    
    def is_healthy(self) -> bool:
        """Check if Kafka service is healthy"""
        try:
            if not self.admin_client:
                return False
            
            # Try to get cluster metadata
            metadata = self.admin_client.list_topics(timeout=5)
            return len(metadata.topics) >= 0
            
        except Exception as e:
            logger.error(f"Kafka health check failed: {e}")
            return False
    
    def get_topic_info(self, topic: str) -> Dict[str, Any]:
        """Get information about a specific topic"""
        try:
            metadata = self.admin_client.list_topics(timeout=5)
            
            if topic in metadata.topics:
                topic_metadata = metadata.topics[topic]
                return {
                    'topic': topic,
                    'partitions': len(topic_metadata.partitions),
                    'error': topic_metadata.error
                }
            else:
                return {'topic': topic, 'exists': False}
                
        except Exception as e:
            logger.error(f"Failed to get topic info: {e}")
            return {'topic': topic, 'error': str(e)}
    
    def __del__(self):
        """Cleanup when service is destroyed"""
        try:
            self.stop_consumer()
            if self.producer:
                self.producer.flush(timeout=5)
        except:
            pass
