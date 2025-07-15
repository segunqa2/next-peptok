import {
  Program,
  ProgramSession,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramAnalytics,
  ProgramTemplate,
} from "@/types/program";
import { toast } from "sonner";
import api from "./api";

/**
 * Program Management Service - Production version using backend API
 *
 * Handles all program-related operations including:
 * - Program creation with automatic session generation
 * - Timeline-based session scheduling
 * - Coach assignment and acceptance workflow
 * - Program progress tracking
 * - Session management within programs
 */
class ProgramService {
  /**
   * Get all programs for the current user
   */
  async getPrograms(filters?: Record<string, any>): Promise<Program[]> {
    try {
      const programs = await api.programs.getPrograms(filters);
      return programs.map(this.mapMatchingRequestToProgram);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      toast.error("Failed to load programs");
      return [];
    }
  }

  /**
   * Get a specific program by ID
   */
  async getProgram(programId: string): Promise<Program | null> {
    try {
      const matchingRequest = await api.programs.getProgram(programId);
      return this.mapMatchingRequestToProgram(matchingRequest);
    } catch (error) {
      console.error("Failed to fetch program:", error);
      toast.error("Failed to load program details");
      return null;
    }
  }

  /**
   * Create a new program with auto-generated sessions based on timeline
   */
  async createProgram(programData: CreateProgramRequest): Promise<Program> {
    try {
      console.log("🚀 Creating new program:", programData.title);

      // Map program data to matching request format
      const matchingRequestData = this.mapProgramToMatchingRequest(programData);

      // Create the program (matching request)
      const createdProgram =
        await api.programs.createProgram(matchingRequestData);

      // Generate sessions based on timeline
      if (programData.timeline && programData.generateSessions !== false) {
        await this.generateSessionsForProgram(
          createdProgram.id,
          programData.timeline,
        );
      }

      const program = this.mapMatchingRequestToProgram(createdProgram);

      console.log("✅ Program created successfully:", program.id);
      toast.success("Program created successfully!");

      return program;
    } catch (error: any) {
      console.error("Failed to create program:", error);
      toast.error(
        error.message || "Failed to create program. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Update an existing program
   */
  async updateProgram(
    programId: string,
    updates: UpdateProgramRequest,
  ): Promise<Program> {
    try {
      console.log("📝 Updating program:", programId);

      const matchingRequestData = this.mapProgramToMatchingRequest(updates);
      const updatedProgram = await api.programs.updateProgram(
        programId,
        matchingRequestData,
      );

      const program = this.mapMatchingRequestToProgram(updatedProgram);

      console.log("✅ Program updated successfully:", programId);
      toast.success("Program updated successfully!");

      return program;
    } catch (error: any) {
      console.error("Failed to update program:", error);
      toast.error(
        error.message || "Failed to update program. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Delete a program
   */
  async deleteProgram(programId: string): Promise<void> {
    try {
      await api.programs.deleteProgram(programId);
      console.log("✅ Program deleted successfully:", programId);
      toast.success("Program deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete program:", error);
      toast.error(
        error.message || "Failed to delete program. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Generate sessions for a program based on timeline
   */
  async generateSessionsForProgram(
    programId: string,
    timeline: any,
  ): Promise<ProgramSession[]> {
    try {
      console.log("📅 Generating sessions for program:", programId);

      const sessionConfig = {
        startDate: timeline.startDate,
        endDate: timeline.endDate,
        frequency: timeline.sessionFrequency,
        hoursPerSession: timeline.hoursPerSession,
        totalSessions: timeline.totalSessions,
        sessionType: timeline.sessionType || "video",
      };

      const sessions = await api.programs.generateSessionsForProgram(
        programId,
        sessionConfig,
      );

      console.log(
        `✅ Generated ${sessions.length} sessions for program ${programId}`,
      );
      toast.success(`Generated ${sessions.length} sessions for the program`);

      return sessions.map(this.mapSessionToProgramSession);
    } catch (error: any) {
      console.error("Failed to generate sessions:", error);
      toast.error(
        error.message || "Failed to generate sessions. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Get sessions for a specific program
   */
  async getProgramSessions(programId: string): Promise<ProgramSession[]> {
    try {
      const sessions = await api.programs.getProgramSessions(programId);
      return sessions.map(this.mapSessionToProgramSession);
    } catch (error) {
      console.error("Failed to fetch program sessions:", error);
      toast.error("Failed to load program sessions");
      return [];
    }
  }

  /**
   * Get programs for a specific company
   */
  async getCompanyPrograms(companyId: string): Promise<Program[]> {
    try {
      const programs = await api.programs.getCompanyPrograms(companyId);
      return programs.map(this.mapMatchingRequestToProgram);
    } catch (error) {
      console.error("Failed to fetch company programs:", error);
      toast.error("Failed to load company programs");
      return [];
    }
  }

  /**
   * Update program status
   */
  async updateProgramStatus(
    programId: string,
    status: string,
  ): Promise<Program> {
    try {
      const updatedProgram = await api.programs.updateProgramStatus(
        programId,
        status,
      );
      const program = this.mapMatchingRequestToProgram(updatedProgram);

      toast.success(`Program status updated to ${status}`);
      return program;
    } catch (error: any) {
      console.error("Failed to update program status:", error);
      toast.error(
        error.message || "Failed to update program status. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Accept a session (for coaches)
   */
  async acceptSession(sessionId: string): Promise<void> {
    try {
      await api.sessions.acceptSession(sessionId);
      toast.success("Session accepted successfully!");
    } catch (error: any) {
      console.error("Failed to accept session:", error);
      toast.error(
        error.message || "Failed to accept session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Decline a session (for coaches)
   */
  async declineSession(sessionId: string, reason?: string): Promise<void> {
    try {
      await api.sessions.declineSession(sessionId, reason);
      toast.success("Session declined");
    } catch (error: any) {
      console.error("Failed to decline session:", error);
      toast.error(
        error.message || "Failed to decline session. Please try again.",
      );
      throw error;
    }
  }

  /**
   * Get sessions awaiting coach acceptance
   */
  async getSessionsAwaitingAcceptance(): Promise<ProgramSession[]> {
    try {
      const sessions = await api.sessions.getSessionsAwaitingAcceptance();
      return sessions.map(this.mapSessionToProgramSession);
    } catch (error) {
      console.error("Failed to fetch sessions awaiting acceptance:", error);
      toast.error("Failed to load pending sessions");
      return [];
    }
  }

  /**
   * Get program analytics
   */
  async getProgramAnalytics(
    programId: string,
  ): Promise<ProgramAnalytics | null> {
    try {
      // This would be a separate analytics endpoint when available
      const program = await this.getProgram(programId);
      const sessions = await this.getProgramSessions(programId);

      if (!program) return null;

      // Calculate basic analytics from program and session data
      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      ).length;
      const totalSessions = sessions.length;
      const progressPercentage =
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      return {
        programId,
        totalSessions,
        completedSessions,
        upcomingSessions: sessions.filter((s) => s.status === "scheduled")
          .length,
        progressPercentage,
        participantCount: program.participants?.length || 0,
        averageRating: 0, // Would come from session feedback
        completionRate: progressPercentage,
      };
    } catch (error) {
      console.error("Failed to fetch program analytics:", error);
      return null;
    }
  }

  // Helper methods for data mapping

  private mapMatchingRequestToProgram(matchingRequest: any): Program {
    return {
      id: matchingRequest.id,
      title: matchingRequest.title || "Coaching Program",
      description: matchingRequest.description || "",
      status: matchingRequest.status || "pending",
      skills: matchingRequest.requiredSkills || [],
      focusAreas: matchingRequest.preferredIndustries || [],
      level: "intermediate", // Default level
      timeline: {
        startDate: matchingRequest.startDate || new Date().toISOString(),
        endDate: matchingRequest.deadline || new Date().toISOString(),
        sessionFrequency: matchingRequest.sessionFrequency || "weekly",
        hoursPerSession: 1,
        totalSessions: 10,
        sessionType: "video",
      },
      participants: matchingRequest.teamMembers || [],
      goals: matchingRequest.goals || [],
      budget: {
        min: matchingRequest.budget?.min || 0,
        max: matchingRequest.budget?.max || 0,
        currency: "USD",
      },
      companyId: matchingRequest.companyId,
      assignedCoachId: matchingRequest.assignedCoachId,
      createdAt: matchingRequest.createdAt,
      updatedAt: matchingRequest.updatedAt,
    };
  }

  private mapProgramToMatchingRequest(program: any): any {
    return {
      title: program.title,
      description: program.description,
      requiredSkills: program.skills || [],
      preferredIndustries: program.focusAreas || [],
      startDate: program.timeline?.startDate,
      deadline: program.timeline?.endDate,
      sessionFrequency: program.timeline?.sessionFrequency || "weekly",
      teamMembers: program.participants || [],
      goals: program.goals || [],
      budget: {
        min: program.budget?.min || 0,
        max: program.budget?.max || 0,
        currency: program.budget?.currency || "USD",
      },
      priority: "medium",
      status: program.status || "pending",
    };
  }

  private mapSessionToProgramSession(session: any): ProgramSession {
    return {
      id: session.id,
      programId: session.programId,
      title: session.title || "Coaching Session",
      description: session.description || "",
      scheduledAt: session.scheduledAt || session.startTime,
      duration: session.duration || 60,
      status: session.status || "scheduled",
      coachId: session.coachId,
      participants: session.participants || [],
      sessionType: session.sessionType || "video",
      meetingUrl: session.meetingUrl,
      notes: session.notes,
      feedback: session.feedback,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  /**
   * Clear any cached data (for development/testing)
   */
  clearCache(): void {
    // In production, this might clear any client-side caches
    console.log("Cache cleared");
    toast.success("Cache cleared");
  }

  /**
   * Get program templates (placeholder until backend implements)
   */
  async getProgramTemplates(): Promise<ProgramTemplate[]> {
    return [
      {
        id: "leadership-development",
        name: "Leadership Development",
        description: "Comprehensive leadership coaching program",
        skills: ["Leadership", "Communication", "Strategic Thinking"],
        duration: "3 months",
        sessionCount: 12,
        level: "intermediate",
      },
      {
        id: "technical-mentorship",
        name: "Technical Mentorship",
        description: "One-on-one technical skill development",
        skills: ["Technical Skills", "Problem Solving", "Code Review"],
        duration: "2 months",
        sessionCount: 8,
        level: "advanced",
      },
    ];
  }
}

// Export singleton instance
export const programService = new ProgramService();
export default programService;
