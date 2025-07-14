import {
  MentorshipRequest,
  MentorshipRequestStatus,
  MentorshipGoal,
  TeamMember,
} from "@/models/MentorshipRequest.js";

export interface IMentorshipRequestReader {
  findById(id: string): Promise<MentorshipRequest | null>;
  findByCompany(
    companyId: string,
    filters?: MentorshipRequestFilters,
  ): Promise<MentorshipRequest[]>;
  findByUser(
    userId: string,
    filters?: MentorshipRequestFilters,
  ): Promise<MentorshipRequest[]>;
  findMany(filters: MentorshipRequestFilters): Promise<MentorshipRequest[]>;
  count(filters?: Partial<MentorshipRequestFilters>): Promise<number>;
}

export interface IMentorshipRequestWriter {
  create(request: MentorshipRequest): Promise<MentorshipRequest>;
  update(
    id: string,
    updates: Partial<MentorshipRequest>,
  ): Promise<MentorshipRequest>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: MentorshipRequestStatus): Promise<void>;
}

export interface IMentorshipGoalWriter {
  addGoal(requestId: string, goal: Omit<MentorshipGoal, "id">): Promise<string>;
  updateGoal(
    requestId: string,
    goalId: string,
    updates: Partial<MentorshipGoal>,
  ): Promise<void>;
  removeGoal(requestId: string, goalId: string): Promise<void>;
  getGoals(requestId: string): Promise<MentorshipGoal[]>;
}

export interface IMentorshipTeamWriter {
  addTeamMember(
    requestId: string,
    member: Omit<TeamMember, "id" | "invitedAt">,
  ): Promise<string>;
  updateTeamMember(
    requestId: string,
    memberId: string,
    updates: Partial<TeamMember>,
  ): Promise<void>;
  removeTeamMember(requestId: string, memberId: string): Promise<void>;
  getTeamMembers(requestId: string): Promise<TeamMember[]>;
  acceptInvitation(
    requestId: string,
    memberId: string,
    userId: string,
  ): Promise<void>;
  declineInvitation(requestId: string, memberId: string): Promise<void>;
}

export interface MentorshipRequestFilters {
  status?: MentorshipRequestStatus;
  companyId?: string;
  createdBy?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "title" | "status";
  sortOrder?: "ASC" | "DESC";
}

export interface IMentorshipRequestRepository
  extends IMentorshipRequestReader,
    IMentorshipRequestWriter,
    IMentorshipGoalWriter,
    IMentorshipTeamWriter {}
