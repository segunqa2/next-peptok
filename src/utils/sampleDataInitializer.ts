import { CoachingRequest } from "@/types";
import LocalStorageService from "@/services/localStorageService";
import { TeamInvitation } from "@/services/invitationService";

export function initializeSampleData() {
  console.log("🔧 Initializing sample data for testing with sync service...");

  // Add sample coaching requests if none exist
  const existingRequests = LocalStorageService.getCoachingRequests();
  if (existingRequests.length === 0) {
    const sampleRequests: CoachingRequest[] = [
      {
        id: "coaching_req_1",
        title: "Leadership Development Program",
        description:
          "Comprehensive leadership training for our senior management team",
        company: "TechCorp Inc.",
        companyId: "company_1",
        status: "submitted",
        goals: [
          "Improve team management skills",
          "Enhance strategic thinking capabilities",
          "Develop better communication with stakeholders",
        ],
        focusAreas: ["Leadership", "Communication", "Strategic Planning"],
        teamMembers: [
          {
            id: "tm_1",
            name: "Sarah Johnson",
            email: "sarah.johnson@techcorp.com",
            role: "Senior Manager",
            status: "pending",
          },
          {
            id: "tm_2",
            name: "Mike Chen",
            email: "mike.chen@techcorp.com",
            role: "Team Lead",
            status: "pending",
          },
        ],
        timeline: "8 weeks",
        budget: {
          min: 3000,
          max: 5000,
          currency: "CAD",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        communicationChannel: {
          platform: "google_meet",
          meetingLink: "https://meet.google.com/abc-defg-hij",
        },
      },
      {
        id: "coaching_req_2",
        title: "Technical Skills Enhancement",
        description:
          "Advanced React and TypeScript training for our development team",
        company: "StartupCo",
        companyId: "company_1",
        status: "in_progress",
        goals: [
          "Master advanced React patterns",
          "Implement robust TypeScript solutions",
          "Improve code review processes",
        ],
        focusAreas: ["React", "TypeScript", "Code Quality"],
        teamMembers: [
          {
            id: "tm_3",
            name: "Alex Rodriguez",
            email: "alex.rodriguez@startupco.com",
            role: "Frontend Developer",
            status: "confirmed",
          },
        ],
        timeline: "6 weeks",
        budget: {
          min: 2000,
          max: 3500,
          currency: "CAD",
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        updatedAt: new Date().toISOString(),
        assignedCoachId: "coach_1",
        communicationChannel: {
          platform: "zoom",
          meetingLink: "https://zoom.us/j/123456789",
        },
      },
      {
        id: "coaching_req_3",
        title: "Sales Team Performance Boost",
        description:
          "Coaching program to enhance sales techniques and customer engagement",
        company: "SalesPro Ltd.",
        companyId: "company_1",
        status: "completed",
        goals: [
          "Increase conversion rates",
          "Improve customer relationships",
          "Enhance negotiation skills",
        ],
        focusAreas: ["Sales Techniques", "Customer Relations", "Negotiation"],
        teamMembers: [
          {
            id: "tm_4",
            name: "Emma Wilson",
            email: "emma.wilson@salespro.com",
            role: "Sales Representative",
            status: "completed",
          },
          {
            id: "tm_5",
            name: "David Kim",
            email: "david.kim@salespro.com",
            role: "Sales Manager",
            status: "completed",
          },
        ],
        timeline: "4 weeks",
        budget: {
          min: 1500,
          max: 2500,
          currency: "CAD",
        },
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 1 month ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        assignedCoachId: "coach_2",
        communicationChannel: {
          platform: "microsoft_teams",
          meetingLink: "https://teams.microsoft.com/l/meetup-join/xyz",
        },
      },
    ];

    sampleRequests.forEach((request) => {
      LocalStorageService.addCoachingRequest(request);
    });

    console.log(`✅ Added ${sampleRequests.length} sample coaching requests`);
  } else {
    console.log(
      `✅ Found ${existingRequests.length} existing coaching requests`,
    );
  }

  // Add sample team invitations if none exist
  const existingInvitations = JSON.parse(
    localStorage.getItem("team_invitations") || "[]",
  );
  if (existingInvitations.length === 0) {
    const sampleInvitations: TeamInvitation[] = [
      {
        id: "inv_1",
        token: "token_sample_1",
        email: "olabanji.segun@gmail.com",
        name: "Oluwasegun Olabanji",
        programId: "coaching_req_1",
        programTitle: "Leadership Development Program",
        companyId: "company_1",
        companyName: "TechCorp Inc.",
        inviterName: "Sarah Johnson",
        inviterEmail: "sarah.johnson@techcorp.com",
        role: "participant",
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        metadata: {
          programDescription:
            "Comprehensive leadership training for our senior management team",
          sessionCount: 8,
          duration: "8 weeks",
          startDate: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 3 days from now
        },
      },
      {
        id: "inv_2",
        token: "token_sample_2",
        email: "olabanji.segun@gmail.com",
        name: "Oluwasegun Olabanji",
        programId: "coaching_req_2",
        programTitle: "Technical Skills Enhancement",
        companyId: "company_1",
        companyName: "StartupCo",
        inviterName: "Alex Rodriguez",
        inviterEmail: "alex.rodriguez@startupco.com",
        role: "participant",
        status: "pending",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        metadata: {
          programDescription:
            "Advanced React and TypeScript training for our development team",
          sessionCount: 6,
          duration: "6 weeks",
          startDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 1 week from now
        },
      },
      {
        id: "inv_3",
        token: "token_sample_3",
        email: "test@example.com",
        name: "Test User",
        programId: "coaching_req_3",
        programTitle: "Sales Team Performance Boost",
        companyId: "company_1",
        companyName: "SalesPro Ltd.",
        inviterName: "Emma Wilson",
        inviterEmail: "emma.wilson@salespro.com",
        role: "observer",
        status: "pending",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        metadata: {
          programDescription:
            "Coaching program to enhance sales techniques and customer engagement",
          sessionCount: 4,
          duration: "4 weeks",
          startDate: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 10 days from now
        },
      },
    ];

    localStorage.setItem("team_invitations", JSON.stringify(sampleInvitations));
    console.log(`✅ Added ${sampleInvitations.length} sample team invitations`);
  } else {
    console.log(
      `✅ Found ${existingInvitations.length} existing team invitations`,
    );
  }

  console.log("🎉 Sample data initialization complete!");
}
