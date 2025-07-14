// Debug utilities for development
export const debugLocalStorage = () => {
  console.log("=== LocalStorage Debug Info ===");
  console.log(
    "mentorship_requests:",
    localStorage.getItem("mentorship_requests"),
  );
  console.log("auth_token:", localStorage.getItem("auth_token"));
  console.log("=====================================");
};

export const clearMentorshipRequests = () => {
  localStorage.removeItem("mentorship_requests");
  console.log("Cleared mentorship requests from localStorage");
};

export const addSampleRequest = () => {
  const sampleRequest = {
    id: `debug_request_${Date.now()}`,
    companyId: "debug-company",
    title: "Debug Test Request",
    description: "This is a test request created for debugging",
    goals: [
      {
        id: "debug_goal_1",
        title: "Test Goal",
        description: "A test goal",
        category: "technical",
        priority: "medium",
      },
    ],
    metricsToTrack: ["Test metric"],
    teamMembers: [],
    preferredExpertise: ["Testing"],
    timeline: {
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sessionFrequency: "weekly",
    },
    status: "submitted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = localStorage.getItem("mentorship_requests");
  const requests = existing ? JSON.parse(existing) : [];
  requests.unshift(sampleRequest);
  localStorage.setItem("mentorship_requests", JSON.stringify(requests));
  console.log("Added sample request:", sampleRequest);
};

// Make functions available globally in development
if (import.meta.env.DEV) {
  (window as any).debugLS = debugLocalStorage;
  (window as any).clearRequests = clearMentorshipRequests;
  (window as any).addSampleRequest = addSampleRequest;
}
