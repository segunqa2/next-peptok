/**
 * Sync Configuration Definitions
 *
 * Defines the sync configurations for all data types in the application
 */

import { SyncConfig } from "./dataSyncService";

export const SYNC_CONFIGS: Record<string, SyncConfig> = {
  // Coaching Requests
  COACHING_REQUESTS: {
    entity: "coaching_requests",
    endpoint: "/coaching-requests",
    localStorageKey: "peptok_coaching_requests",
    idField: "id",
  },

  // Mentorship Requests (legacy)
  MENTORSHIP_REQUESTS: {
    entity: "mentorship_requests",
    endpoint: "/mentorship-requests",
    localStorageKey: "mentorship_requests",
    idField: "id",
  },

  // Team Invitations
  TEAM_INVITATIONS: {
    entity: "team_invitations",
    endpoint: "/team/invitations",
    localStorageKey: "team_invitations",
    idField: "id",
  },

  // Users
  USERS: {
    entity: "users",
    endpoint: "/users",
    localStorageKey: "peptok_users",
    idField: "id",
  },

  // Coaches
  COACHES: {
    entity: "coaches",
    endpoint: "/coaches",
    localStorageKey: "peptok_coaches",
    idField: "id",
  },

  // Companies
  COMPANIES: {
    entity: "companies",
    endpoint: "/companies",
    localStorageKey: "peptok_companies",
    idField: "id",
  },

  // Sessions
  SESSIONS: {
    entity: "sessions",
    endpoint: "/sessions",
    localStorageKey: "peptok_sessions",
    idField: "id",
  },

  // Team Members
  TEAM_MEMBERS: {
    entity: "team_members",
    endpoint: "/team/members",
    localStorageKey: "peptok_team_members",
    idField: "id",
  },

  // Messages
  MESSAGES: {
    entity: "messages",
    endpoint: "/messages",
    localStorageKey: "peptok_messages",
    idField: "id",
  },

  // Reviews/Feedback
  REVIEWS: {
    entity: "reviews",
    endpoint: "/reviews",
    localStorageKey: "peptok_reviews",
    idField: "id",
  },

  // Match Requests
  MATCH_REQUESTS: {
    entity: "match_requests",
    endpoint: "/matches",
    localStorageKey: "peptok_match_requests",
    idField: "id",
  },

  // Analytics Data
  ANALYTICS: {
    entity: "analytics",
    endpoint: "/analytics",
    localStorageKey: "peptok_analytics_data",
    idField: "id",
  },

  // Platform Configuration
  PLATFORM_CONFIG: {
    entity: "platform_config",
    endpoint: "/admin/platform-config",
    localStorageKey: "peptok_platform_config",
    idField: "id",
  },

  // Pricing Configuration
  PRICING_CONFIG: {
    entity: "pricing_config",
    endpoint: "/admin/pricing-config",
    localStorageKey: "peptok_pricing_config",
    idField: "id",
  },
};

export const getSyncConfig = (entity: string): SyncConfig => {
  const config = SYNC_CONFIGS[entity.toUpperCase()];
  if (!config) {
    throw new Error(`No sync configuration found for entity: ${entity}`);
  }
  return config;
};

export const getAllSyncConfigs = (): SyncConfig[] => {
  return Object.values(SYNC_CONFIGS);
};
