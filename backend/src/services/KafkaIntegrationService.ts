import { kafka } from "kafkajs";
import { logger } from "../config/logger.js";

interface MatchingRequest {
  request_id: string;
  company_id: string;
  program_id: string;
  title: string;
  description: string;
  session_type: string;
  priority: string;
  skills_required: Array<{
    name: string;
    level: string;
    weight: number;
    mandatory: boolean;
  }>;
  experience_level: string;
  budget_constraints: {
    max_hourly_rate?: number;
    total_budget?: number;
    currency: string;
    payment_frequency: string;
  };
  availability_requirements: {
    days_of_week: number[];
    time_slots: string[];
    timezone: string;
    flexibility: number;
  };
  preferred_languages: string[];
  participants_count: number;
  session_duration_minutes: number;
  total_sessions: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface MatchingResponse {
  request_id: string;
  matches: Array<{
    coach: any;
    match_score: number;
    skill_score: number;
    experience_score: number;
    availability_score: number;
    price_score: number;
    rating_score: number;
    matching_skills: string[];
    missing_skills: string[];
    availability_overlap: number;
    price_difference_percent: number;
    confidence_level: number;
    recommendation_reason: string;
  }>;
  total_coaches_evaluated: number;
  processing_time_ms: number;
  algorithm_version: string;
  timestamp: string;
  average_match_score: number;
  best_match_score: number;
}

export class KafkaIntegrationService {
  private kafkaClient: any;
  private producer: any;
  private consumer: any;
  private isConnected = false;
  private responseHandlers = new Map<
    string,
    (response: MatchingResponse) => void
  >();

  constructor() {
    this.initializeKafka();
  }

  private async initializeKafka() {
    try {
      const kafkaBootstrapServers =
        process.env.KAFKA_BOOTSTRAP_SERVERS || "kafka:9092";

      this.kafkaClient = kafka({
        clientId: "backend-service",
        brokers: kafkaBootstrapServers.split(","),
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      });

      this.producer = this.kafkaClient.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

      this.consumer = this.kafkaClient.consumer({
        groupId: "backend-matching-consumer",
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.producer.connect();
      await this.consumer.connect();

      // Subscribe to response topics
      await this.consumer.subscribe({
        topics: ["matching-responses", "matching-errors"],
        fromBeginning: false,
      });

      // Start consuming responses
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = message.value?.toString();
            if (!messageValue) return;

            const data = JSON.parse(messageValue);

            if (topic === "matching-responses") {
              this.handleMatchingResponse(data);
            } else if (topic === "matching-errors") {
              this.handleMatchingError(data);
            }
          } catch (error) {
            logger.error("Error processing Kafka message:", error);
          }
        },
      });

      this.isConnected = true;
      logger.info("Kafka integration service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Kafka:", error);
      this.isConnected = false;
    }
  }

  async requestCoachMatching(
    matchingRequest: MatchingRequest,
  ): Promise<string> {
    try {
      if (!this.isConnected) {
        throw new Error("Kafka service not connected");
      }

      const requestId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const kafkaMessage = {
        ...matchingRequest,
        request_id: requestId,
        created_at: new Date().toISOString(),
      };

      await this.producer.send({
        topic: "matching-requests",
        messages: [
          {
            key: requestId,
            value: JSON.stringify(kafkaMessage),
            headers: {
              "content-type": "application/json",
              "source-service": "backend",
            },
          },
        ],
      });

      logger.info(`Matching request sent to Kafka: ${requestId}`);
      return requestId;
    } catch (error) {
      logger.error("Failed to send matching request:", error);
      throw error;
    }
  }

  registerResponseHandler(
    requestId: string,
    handler: (response: MatchingResponse) => void,
  ): void {
    this.responseHandlers.set(requestId, handler);

    // Clean up handler after 5 minutes
    setTimeout(
      () => {
        this.responseHandlers.delete(requestId);
      },
      5 * 60 * 1000,
    );
  }

  private handleMatchingResponse(response: MatchingResponse): void {
    const { request_id } = response;

    logger.info(`Received matching response for request: ${request_id}`);

    const handler = this.responseHandlers.get(request_id);
    if (handler) {
      try {
        handler(response);
        this.responseHandlers.delete(request_id);
      } catch (error) {
        logger.error(
          `Error handling matching response for ${request_id}:`,
          error,
        );
      }
    } else {
      logger.warn(`No handler found for matching response: ${request_id}`);
    }
  }

  private handleMatchingError(error: any): void {
    const { request_id, error_message } = error;

    logger.error(`Matching error for request ${request_id}: ${error_message}`);

    const handler = this.responseHandlers.get(request_id);
    if (handler) {
      try {
        // Call handler with error response
        handler({
          request_id,
          matches: [],
          total_coaches_evaluated: 0,
          processing_time_ms: 0,
          algorithm_version: "unknown",
          timestamp: new Date().toISOString(),
          average_match_score: 0,
          best_match_score: 0,
        });
        this.responseHandlers.delete(request_id);
      } catch (handlerError) {
        logger.error(
          `Error handling matching error for ${request_id}:`,
          handlerError,
        );
      }
    }
  }

  async getServiceHealth(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      // Simple health check by sending a test message
      const admin = this.kafkaClient.admin();
      await admin.connect();
      const metadata = await admin.fetchTopicMetadata();
      await admin.disconnect();

      return true;
    } catch (error) {
      logger.error("Kafka health check failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) await this.producer.disconnect();
      if (this.consumer) await this.consumer.disconnect();
      this.isConnected = false;
      logger.info("Kafka integration service disconnected");
    } catch (error) {
      logger.error("Error disconnecting Kafka service:", error);
    }
  }
}

// Export singleton instance
export const kafkaIntegrationService = new KafkaIntegrationService();
