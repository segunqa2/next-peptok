import { Session, SessionScheduleRequest } from "@/types/session";
import { Coach } from "@/types/coach";
import { MentorshipRequest } from "@/types";
import { apiEnhanced } from "./apiEnhanced";

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  availability: "available" | "busy" | "preferred";
  coachId: string;
  conflictReason?: string;
}

export interface ScheduleRecommendation {
  timeSlot: TimeSlot;
  score: number; // 0-100, higher is better
  reasoning: string[];
  coachAvailability: "high" | "medium" | "low";
  programFit: "excellent" | "good" | "fair";
  urgency: "immediate" | "soon" | "flexible";
}

export interface RecommendationRequest {
  mentorshipRequestId: string;
  coachId: string;
  preferredDuration: number; // minutes
  preferredTimeFrames?: {
    startDate: Date;
    endDate: Date;
    preferredDays: number[]; // 0-6, Sunday to Saturday
    preferredHours: { start: number; end: number }; // 24-hour format
  };
  urgency: "immediate" | "soon" | "flexible";
  sessionType: "video" | "audio" | "chat";
}

export interface CoachAvailability {
  coachId: string;
  timeZone: string;
  workingHours: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  blackoutDates: Date[];
  preferredSessionLength: number; // minutes
  maxSessionsPerDay: number;
  bufferTime: number; // minutes between sessions
}

class SessionRecommendationEngine {
  private readonly SCORING_WEIGHTS = {
    timePreference: 0.3,
    coachAvailability: 0.25,
    programConstraints: 0.2,
    urgency: 0.15,
    conflictAvoidance: 0.1,
  };

  /**
   * Get intelligent session recommendations based on coach availability and program constraints
   */
  async getRecommendations(
    request: RecommendationRequest,
  ): Promise<ScheduleRecommendation[]> {
    try {
      console.log("🤖 Generating session recommendations for:", request);

      // Step 1: Get coach availability
      const coachAvailability = await this.getCoachAvailability(
        request.coachId,
      );

      // Step 2: Get existing sessions to avoid conflicts
      const existingSessions = await this.getExistingSessions(request.coachId);

      // Step 3: Get program constraints
      const programConstraints = await this.getProgramConstraints(
        request.mentorshipRequestId,
      );

      // Step 4: Generate possible time slots
      const possibleSlots = this.generateTimeSlots(
        request,
        coachAvailability,
        existingSessions,
      );

      // Step 5: Score and rank recommendations
      const recommendations = this.scoreRecommendations(
        possibleSlots,
        request,
        programConstraints,
      );

      // Step 6: Sort by score and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Return top 10 recommendations

      console.log(
        `✅ Generated ${sortedRecommendations.length} session recommendations`,
      );
      return sortedRecommendations;
    } catch (error) {
      console.error("❌ Failed to generate session recommendations:", error);
      throw new Error("Failed to generate session recommendations");
    }
  }

  /**
   * Get real-time coach availability from NestJS backend
   */
  private async getCoachAvailability(
    coachId: string,
  ): Promise<CoachAvailability> {
    try {
      // Try to get from backend first
      const response = await apiEnhanced.request<CoachAvailability>(
        `/coaches/${coachId}/availability`,
      );
      return response.data;
    } catch (error) {
      console.warn("Using mock coach availability data:", error);

      // Fallback to intelligent mock data
      return {
        coachId,
        timeZone: "America/New_York",
        workingHours: {
          monday: { start: "09:00", end: "17:00", available: true },
          tuesday: { start: "09:00", end: "17:00", available: true },
          wednesday: { start: "09:00", end: "17:00", available: true },
          thursday: { start: "09:00", end: "17:00", available: true },
          friday: { start: "09:00", end: "17:00", available: true },
          saturday: { start: "10:00", end: "14:00", available: false },
          sunday: { start: "10:00", end: "14:00", available: false },
        },
        blackoutDates: [],
        preferredSessionLength: 60,
        maxSessionsPerDay: 6,
        bufferTime: 15,
      };
    }
  }

  /**
   * Get existing sessions to avoid scheduling conflicts
   */
  private async getExistingSessions(coachId: string): Promise<Session[]> {
    try {
      const response = await apiEnhanced.request<Session[]>(
        `/sessions/coach/${coachId}?status=scheduled`,
      );
      return response.data;
    } catch (error) {
      console.warn("Using mock sessions data:", error);
      return []; // Return empty array as fallback
    }
  }

  /**
   * Get program-specific constraints and preferences
   */
  private async getProgramConstraints(mentorshipRequestId: string) {
    try {
      const request =
        await apiEnhanced.getMentorshipRequest(mentorshipRequestId);
      return {
        timeline: request.timeline,
        sessionFrequency: request.timeline?.sessionFrequency || "bi-weekly",
        preferredDuration: 60, // default 1 hour
        teamSize: request.teamMembers?.length || 1,
      };
    } catch (error) {
      console.warn("Using default program constraints:", error);
      return {
        sessionFrequency: "bi-weekly",
        preferredDuration: 60,
        teamSize: 1,
      };
    }
  }

  /**
   * Generate possible time slots based on availability and constraints
   */
  private generateTimeSlots(
    request: RecommendationRequest,
    availability: CoachAvailability,
    existingSessions: Session[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const startDate = request.preferredTimeFrames?.startDate || now;
    const endDate =
      request.preferredTimeFrames?.endDate ||
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Generate slots for each day in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const daySlots = this.generateDaySlots(
        new Date(d),
        request,
        availability,
        existingSessions,
      );
      slots.push(...daySlots);
    }

    return slots;
  }

  /**
   * Generate time slots for a specific day
   */
  private generateDaySlots(
    date: Date,
    request: RecommendationRequest,
    availability: CoachAvailability,
    existingSessions: Session[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayName = date.toLocaleDateString("en-US", {
      weekday: "lowercase",
    }) as keyof CoachAvailability["workingHours"];
    const dayAvailability = availability.workingHours[dayName];

    if (!dayAvailability.available) {
      return slots;
    }

    // Parse working hours
    const [startHour, startMinute] = dayAvailability.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(":").map(Number);

    // Generate slots in 30-minute intervals
    const intervalMinutes = 30;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (hour === endHour - 1 && minute + request.preferredDuration > 60) {
          break; // Don't create slots that would exceed working hours
        }

        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + request.preferredDuration);

        // Check for conflicts with existing sessions
        const hasConflict = existingSessions.some((session) => {
          const sessionStart = new Date(session.scheduledStartTime);
          const sessionEnd = new Date(session.scheduledEndTime);
          return slotStart < sessionEnd && slotEnd > sessionStart;
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          availability: hasConflict ? "busy" : "available",
          coachId: availability.coachId,
          conflictReason: hasConflict ? "Existing session conflict" : undefined,
        });
      }
    }

    return slots;
  }

  /**
   * Score and rank recommendations based on multiple factors
   */
  private scoreRecommendations(
    timeSlots: TimeSlot[],
    request: RecommendationRequest,
    programConstraints: any,
  ): ScheduleRecommendation[] {
    return timeSlots
      .filter((slot) => slot.availability === "available")
      .map((slot) => {
        const scores = {
          timePreference: this.scoreTimePreference(slot, request),
          coachAvailability: this.scoreCoachAvailability(slot),
          programConstraints: this.scoreProgramFit(slot, programConstraints),
          urgency: this.scoreUrgency(slot, request.urgency),
          conflictAvoidance: 100, // No conflicts since we filtered them out
        };

        const totalScore = Object.entries(scores).reduce(
          (total, [key, score]) => {
            const weight =
              this.SCORING_WEIGHTS[key as keyof typeof this.SCORING_WEIGHTS];
            return total + score * weight;
          },
          0,
        );

        const reasoning: string[] = [];
        if (scores.timePreference > 80)
          reasoning.push("Matches preferred time frame");
        if (scores.coachAvailability > 80)
          reasoning.push("Coach has high availability");
        if (scores.urgency > 80) reasoning.push("Meets urgency requirements");

        return {
          timeSlot: slot,
          score: Math.round(totalScore),
          reasoning,
          coachAvailability: this.getAvailabilityLevel(
            scores.coachAvailability,
          ),
          programFit: this.getProgramFitLevel(scores.programConstraints),
          urgency: request.urgency,
        };
      });
  }

  private scoreTimePreference(
    slot: TimeSlot,
    request: RecommendationRequest,
  ): number {
    if (!request.preferredTimeFrames) return 70; // Neutral score

    const slotHour = slot.startTime.getHours();
    const slotDay = slot.startTime.getDay();

    let score = 50; // Base score

    // Check preferred days
    if (request.preferredTimeFrames.preferredDays?.includes(slotDay)) {
      score += 30;
    }

    // Check preferred hours
    const preferredHours = request.preferredTimeFrames.preferredHours;
    if (
      preferredHours &&
      slotHour >= preferredHours.start &&
      slotHour <= preferredHours.end
    ) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private scoreCoachAvailability(slot: TimeSlot): number {
    // For now, return high availability since we filtered out conflicts
    // In real implementation, this would consider coach's workload, preferences, etc.
    return 85;
  }

  private scoreProgramFit(slot: TimeSlot, constraints: any): number {
    // Score based on how well the slot fits program constraints
    let score = 70; // Base score

    // Consider session frequency requirements
    // This would be more sophisticated in real implementation
    return score;
  }

  private scoreUrgency(
    slot: TimeSlot,
    urgency: "immediate" | "soon" | "flexible",
  ): number {
    const now = new Date();
    const hoursUntilSlot =
      (slot.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    switch (urgency) {
      case "immediate":
        return hoursUntilSlot <= 24
          ? 100
          : Math.max(0, 100 - hoursUntilSlot * 2);
      case "soon":
        return hoursUntilSlot <= 72 ? 90 : Math.max(0, 90 - hoursUntilSlot);
      case "flexible":
        return 70; // Neutral score for flexible timing
      default:
        return 50;
    }
  }

  private getAvailabilityLevel(score: number): "high" | "medium" | "low" {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  }

  private getProgramFitLevel(score: number): "excellent" | "good" | "fair" {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    return "fair";
  }

  /**
   * Book a recommended session
   */
  async bookRecommendedSession(
    recommendation: ScheduleRecommendation,
    sessionDetails: Omit<
      SessionScheduleRequest,
      "scheduledStartTime" | "scheduledEndTime"
    >,
  ): Promise<Session> {
    const scheduleRequest: SessionScheduleRequest = {
      ...sessionDetails,
      scheduledStartTime: recommendation.timeSlot.startTime,
      scheduledEndTime: recommendation.timeSlot.endTime,
    };

    try {
      const response = await apiEnhanced.request<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify(scheduleRequest),
      });

      console.log("✅ Session booked successfully:", response.data.id);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to book session:", error);
      throw new Error("Failed to book session");
    }
  }
}

export const sessionRecommendationEngine = new SessionRecommendationEngine();
