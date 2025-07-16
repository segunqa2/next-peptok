// Utility to clear cached mentorship request data for development
export const clearMentorshipRequestCache = () => {
  try {
    localStorage.removeItem("mentorship_requests");
    localStorage.removeItem("peptok_demo_data");
    console.log("✅ Cleared mentorship request cache");
    return true;
  } catch (error) {
    console.error("Failed to clear cache:", error);
    return false;
  }
};

// Auto-clear cache if needed (for development)
if (
  typeof window !== "undefined" &&
  window.location.pathname.includes("/mentorship/requests/")
) {
  clearMentorshipRequestCache();
}
