import {
  Program,
  ProgramSession,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramAnalytics,
  ProgramTemplate,
} from "@/types/program";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

/**
 * Program Management Service
 *
 * Handles all program-related operations including:
 * - Program creation with automatic session generation
 * - Timeline-based session scheduling
 * - Coach assignment and acceptance workflow
 * - Program progress tracking
 * - Session management within programs
 */
class ProgramService {
  private readonly STORAGE_KEY = "peptok_programs";
  private readonly SESSIONS_STORAGE_KEY = "peptok_program_sessions";

  /**
   * Clear all dummy/mock program data
   */
  clearDummyData(): void {
    try {
      // Clear programs
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.SESSIONS_STORAGE_KEY);

      // Clear related legacy data
      localStorage.removeItem("mentorship_requests");
      localStorage.removeItem("demoMentorshipRequests");
      localStorage.removeItem("coaching_requests");
      localStorage.removeItem("peptok_coaching_requests");

      console.log("✅ Dummy program data cleared successfully");
      toast.success("System refreshed - ready for new programs");
    } catch (error) {
      console.error("Failed to clear dummy data:", error);
      toast.error("Failed to clear system data");
    }
  }

  /**
   * Create a new program with auto-generated sessions based on timeline
   */
  async createProgram(request: CreateProgramRequest): Promise<Program> {
    try {
      const programId = uuidv4();
      const now = new Date().toISOString();

      const program: Program = {
        ...request,
        id: programId,
        status: "pending_coach_acceptance",
        sessions: [],
        progress: {
          completedSessions: 0,
          totalSessions: request.timeline.totalSessions,
          progressPercentage: 0,
        },
        createdAt: now,
        updatedAt: now,
      };

      // Generate sessions based on timeline
      const sessions = this.generateSessionsFromTimeline(program);
      program.sessions = sessions;

      // Save program
      await this.saveProgram(program);

      // Save sessions separately for easier querying
      await this.saveProgramSessions(programId, sessions);

      console.log(`✅ Program created: ${program.title} (${program.id})`);
      toast.success(`Program "${program.title}" created successfully`);

      return program;
    } catch (error) {
      console.error("Failed to create program:", error);
      toast.error("Failed to create program");
      throw error;
    }
  }

  /**
   * Generate sessions from program timeline
   */
  private generateSessionsFromTimeline(program: Program): ProgramSession[] {
    const sessions: ProgramSession[] = [];
    const { timeline } = program;

    const startDate = new Date(timeline.startDate);
    const sessionIntervals = this.getSessionIntervals(
      timeline.sessionFrequency,
    );

    for (let i = 0; i < timeline.totalSessions; i++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + i * sessionIntervals);

      const session: ProgramSession = {
        id: uuidv4(),
        programId: program.id,
        title: `${program.title} - Session ${i + 1}`,
        description: `Session ${i + 1} of ${timeline.totalSessions}`,
        sessionNumber: i + 1,
        scheduledDate: sessionDate.toISOString().split("T")[0],
        scheduledTime: "09:00", // Default time, can be customized
        duration: timeline.hoursPerSession * 60, // Convert to minutes
        timezone: "UTC", // Default timezone
        type: timeline.sessionType,
        format: program.participants.length > 1 ? "group" : "one-on-one",
        status: "scheduled",
        participants: program.participants.map((p) => ({
          ...p,
          attendance: undefined,
        })),
        coachId: program.assignedCoachId || "",
        coachName: program.assignedCoachName || "",
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
        createdBy: program.createdBy,
      };

      sessions.push(session);
    }

    return sessions;
  }

  /**
   * Get interval days based on frequency
   */
  private getSessionIntervals(frequency: string): number {
    switch (frequency) {
      case "weekly":
        return 7;
      case "bi-weekly":
        return 14;
      case "monthly":
        return 30;
      default:
        return 7; // Default to weekly
    }
  }

  /**
   * Get all programs with filtering
   */
  async getPrograms(filters?: {
    companyId?: string;
    coachId?: string;
    status?: string;
    limit?: number;
  }): Promise<Program[]> {
    try {
      const programs = await this.loadPrograms();

      let filteredPrograms = programs;

      // Apply filters
      if (filters?.companyId) {
        filteredPrograms = filteredPrograms.filter(
          (p) => p.companyId === filters.companyId,
        );
      }

      if (filters?.coachId) {
        filteredPrograms = filteredPrograms.filter(
          (p) => p.assignedCoachId === filters.coachId,
        );
      }

      if (filters?.status) {
        filteredPrograms = filteredPrograms.filter(
          (p) => p.status === filters.status,
        );
      }

      if (filters?.limit) {
        filteredPrograms = filteredPrograms.slice(0, filters.limit);
      }

      return filteredPrograms;
    } catch (error) {
      console.error("Failed to get programs:", error);
      return [];
    }
  }

  /**
   * Get program by ID
   */
  async getProgramById(id: string): Promise<Program | null> {
    try {
      const programs = await this.loadPrograms();
      return programs.find((p) => p.id === id) || null;
    } catch (error) {
      console.error("Failed to get program:", error);
      return null;
    }
  }

  /**
   * Update program
   */
  async updateProgram(request: UpdateProgramRequest): Promise<Program> {
    try {
      const programs = await this.loadPrograms();
      const index = programs.findIndex((p) => p.id === request.id);

      if (index === -1) {
        throw new Error("Program not found");
      }

      const updatedProgram: Program = {
        ...programs[index],
        ...request,
        updatedAt: new Date().toISOString(),
      };

      // If timeline changed, regenerate sessions
      if (request.timeline) {
        const newSessions = this.generateSessionsFromTimeline(updatedProgram);
        updatedProgram.sessions = newSessions;
        await this.saveProgramSessions(updatedProgram.id, newSessions);
      }

      programs[index] = updatedProgram;
      await this.saveAllPrograms(programs);

      console.log(`✅ Program updated: ${updatedProgram.title}`);
      toast.success("Program updated successfully");

      return updatedProgram;
    } catch (error) {
      console.error("Failed to update program:", error);
      toast.error("Failed to update program");
      throw error;
    }
  }

  /**
   * Coach accepts or rejects a program
   */
  async respondToProgram(
    programId: string,
    response: "accepted" | "rejected",
    message?: string,
    proposedChanges?: Partial<Program>,
  ): Promise<Program> {
    try {
      const program = await this.getProgramById(programId);
      if (!program) {
        throw new Error("Program not found");
      }

      const updatedProgram: Program = {
        ...program,
        status: response === "accepted" ? "in_progress" : "cancelled",
        coachResponse: {
          status: response,
          respondedAt: new Date().toISOString(),
          message,
          proposedChanges,
        },
        updatedAt: new Date().toISOString(),
      };

      await this.updateProgram(updatedProgram);

      const responseText = response === "accepted" ? "accepted" : "rejected";
      console.log(`✅ Program ${responseText}: ${program.title}`);
      toast.success(`Program ${responseText} successfully`);

      return updatedProgram;
    } catch (error) {
      console.error("Failed to respond to program:", error);
      toast.error("Failed to respond to program");
      throw error;
    }
  }

  /**
   * Get sessions for a program
   */
  async getProgramSessions(programId: string): Promise<ProgramSession[]> {
    try {
      const sessionsData = localStorage.getItem(this.SESSIONS_STORAGE_KEY);
      if (!sessionsData) return [];

      const allSessions: Record<string, ProgramSession[]> =
        JSON.parse(sessionsData);
      return allSessions[programId] || [];
    } catch (error) {
      console.error("Failed to get program sessions:", error);
      return [];
    }
  }

  /**
   * Update a session within a program
   */
  async updateProgramSession(
    sessionId: string,
    updates: Partial<ProgramSession>,
  ): Promise<ProgramSession> {
    try {
      const sessionsData = localStorage.getItem(this.SESSIONS_STORAGE_KEY);
      if (!sessionsData) throw new Error("No sessions found");

      const allSessions: Record<string, ProgramSession[]> =
        JSON.parse(sessionsData);

      // Find and update the session
      let updatedSession: ProgramSession | null = null;
      for (const programId in allSessions) {
        const sessionIndex = allSessions[programId].findIndex(
          (s) => s.id === sessionId,
        );
        if (sessionIndex !== -1) {
          updatedSession = {
            ...allSessions[programId][sessionIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          allSessions[programId][sessionIndex] = updatedSession;
          break;
        }
      }

      if (!updatedSession) {
        throw new Error("Session not found");
      }

      localStorage.setItem(
        this.SESSIONS_STORAGE_KEY,
        JSON.stringify(allSessions),
      );

      console.log(`✅ Session updated: ${updatedSession.title}`);
      toast.success("Session updated successfully");

      return updatedSession;
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
      throw error;
    }
  }

  /**
   * Delete a program and all its sessions
   */
  async deleteProgram(programId: string): Promise<void> {
    try {
      // Remove from programs
      const programs = await this.loadPrograms();
      const filteredPrograms = programs.filter((p) => p.id !== programId);
      await this.saveAllPrograms(filteredPrograms);

      // Remove sessions
      const sessionsData = localStorage.getItem(this.SESSIONS_STORAGE_KEY);
      if (sessionsData) {
        const allSessions: Record<string, ProgramSession[]> =
          JSON.parse(sessionsData);
        delete allSessions[programId];
        localStorage.setItem(
          this.SESSIONS_STORAGE_KEY,
          JSON.stringify(allSessions),
        );
      }

      console.log(`✅ Program deleted: ${programId}`);
      toast.success("Program deleted successfully");
    } catch (error) {
      console.error("Failed to delete program:", error);
      toast.error("Failed to delete program");
      throw error;
    }
  }

  /**
   * Get program analytics
   */
  async getProgramAnalytics(
    programId: string,
  ): Promise<ProgramAnalytics | null> {
    try {
      const program = await this.getProgramById(programId);
      const sessions = await this.getProgramSessions(programId);

      if (!program) return null;

      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      );
      const cancelledSessions = sessions.filter(
        (s) => s.status === "cancelled",
      );

      const analytics: ProgramAnalytics = {
        programId,
        metrics: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          cancelledSessions: cancelledSessions.length,
          averageAttendance: this.calculateAverageAttendance(sessions),
          averageRating: this.calculateAverageRating(sessions),
          completionRate:
            sessions.length > 0
              ? (completedSessions.length / sessions.length) * 100
              : 0,
          progressPercentage: program.progress.progressPercentage,
        },
        participantMetrics: this.calculateParticipantMetrics(program, sessions),
        timeMetrics: {
          totalHoursScheduled:
            sessions.length * program.timeline.hoursPerSession,
          totalHoursCompleted:
            completedSessions.length * program.timeline.hoursPerSession,
          averageSessionDuration: program.timeline.hoursPerSession * 60, // in minutes
        },
        costMetrics: this.calculateCostMetrics(program, sessions),
        lastUpdated: new Date().toISOString(),
      };

      return analytics;
    } catch (error) {
      console.error("Failed to get program analytics:", error);
      return null;
    }
  }

  // Private helper methods
  private async loadPrograms(): Promise<Program[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load programs:", error);
      return [];
    }
  }

  private async saveProgram(program: Program): Promise<void> {
    const programs = await this.loadPrograms();
    const existingIndex = programs.findIndex((p) => p.id === program.id);

    if (existingIndex >= 0) {
      programs[existingIndex] = program;
    } else {
      programs.push(program);
    }

    await this.saveAllPrograms(programs);
  }

  private async saveAllPrograms(programs: Program[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(programs));
  }

  private async saveProgramSessions(
    programId: string,
    sessions: ProgramSession[],
  ): Promise<void> {
    try {
      const existing = localStorage.getItem(this.SESSIONS_STORAGE_KEY);
      const allSessions: Record<string, ProgramSession[]> = existing
        ? JSON.parse(existing)
        : {};

      allSessions[programId] = sessions;
      localStorage.setItem(
        this.SESSIONS_STORAGE_KEY,
        JSON.stringify(allSessions),
      );
    } catch (error) {
      console.error("Failed to save program sessions:", error);
    }
  }

  private calculateAverageAttendance(sessions: ProgramSession[]): number {
    const completedSessions = sessions.filter((s) => s.status === "completed");
    if (completedSessions.length === 0) return 0;

    const totalAttendance = completedSessions.reduce((sum, session) => {
      const attendedCount = session.participants.filter(
        (p) => p.attendance === "attended",
      ).length;
      return sum + attendedCount / session.participants.length;
    }, 0);

    return (totalAttendance / completedSessions.length) * 100;
  }

  private calculateAverageRating(sessions: ProgramSession[]): number {
    const sessionsWithRatings = sessions.filter((s) => s.feedback?.coachRating);
    if (sessionsWithRatings.length === 0) return 0;

    const totalRating = sessionsWithRatings.reduce((sum, session) => {
      return sum + (session.feedback?.coachRating || 0);
    }, 0);

    return totalRating / sessionsWithRatings.length;
  }

  private calculateParticipantMetrics(
    program: Program,
    sessions: ProgramSession[],
  ) {
    return program.participants.map((participant) => {
      const participantSessions = sessions.filter((s) =>
        s.participants.some((p) => p.id === participant.id),
      );

      const attendedSessions = participantSessions.filter(
        (s) =>
          s.participants.find((p) => p.id === participant.id)?.attendance ===
          "attended",
      );

      const ratings = participantSessions
        .filter((s) => s.feedback?.participantRatings)
        .flatMap((s) =>
          s.feedback!.participantRatings!.filter(
            (r) => r.participantId === participant.id,
          ),
        )
        .map((r) => r.rating);

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        participantId: participant.id,
        name: participant.name,
        attendanceRate:
          participantSessions.length > 0
            ? (attendedSessions.length / participantSessions.length) * 100
            : 0,
        averageRating,
        goalsCompleted: program.goals.filter((g) => g.completed).length,
        totalGoals: program.goals.length,
      };
    });
  }

  private calculateCostMetrics(program: Program, sessions: ProgramSession[]) {
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const totalBudget = program.budget.totalBudget || program.budget.max;
    const costPerSession =
      program.budget.budgetPerSession ||
      totalBudget / program.timeline.totalSessions;
    const spentBudget = completedSessions.length * costPerSession;

    return {
      totalBudget,
      spentBudget,
      remainingBudget: totalBudget - spentBudget,
      costPerSession,
      costPerParticipant:
        program.participants.length > 0
          ? costPerSession / program.participants.length
          : 0,
    };
  }
}

// Export singleton instance
export const programService = new ProgramService();
