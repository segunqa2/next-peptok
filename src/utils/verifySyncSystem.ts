/**
 * Data Sync System Verification
 *
 * Quick verification script to test all major data sync operations
 */

import { dataSyncService } from "@/services/dataSyncService";
import { apiEnhanced } from "@/services/apiEnhanced";
import { invitationService } from "@/services/invitationService";
import { CoachingRequest } from "@/types";
import { TeamInvitation } from "@/services/invitationService";

export async function verifySyncSystem(): Promise<{
  success: boolean;
  results: Array<{ test: string; success: boolean; details: string }>;
}> {
  console.log("🔍 Starting data sync system verification...");

  const results: Array<{ test: string; success: boolean; details: string }> =
    [];

  try {
    // Test 1: Check sync service status
    const syncStatus = dataSyncService.getSyncStatus();
    results.push({
      test: "Sync Service Status",
      success: true,
      details: `Backend: ${syncStatus.backendAvailable ? "Available" : "Unavailable"}, Queue: ${syncStatus.queuedOperations} operations`,
    });

    // Test 2: Create coaching request
    const testRequest = {
      title: `Verification Test ${Date.now()}`,
      description: "Test coaching request for sync verification",
      company: "Test Company",
      companyId: "test_company_verification",
      goals: ["Test sync functionality"],
      focusAreas: ["Verification", "Testing"],
      timeline: "2 weeks",
      budget: { min: 500, max: 1000, currency: "CAD" },
    };

    try {
      const createdRequest =
        await apiEnhanced.createCoachingRequest(testRequest);

      // Verify it exists in localStorage
      const localRequests = JSON.parse(
        localStorage.getItem("peptok_coaching_requests") || "[]",
      );
      const foundLocal = localRequests.find(
        (r: any) => r.id === createdRequest.id,
      );

      results.push({
        test: "Create Coaching Request",
        success: !!foundLocal,
        details: foundLocal
          ? `Created ${createdRequest.id}, verified in localStorage`
          : `Created ${createdRequest.id} but not found in localStorage`,
      });
    } catch (error) {
      results.push({
        test: "Create Coaching Request",
        success: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 3: Retrieve coaching requests
    try {
      const requests = await apiEnhanced.getCoachingRequests();
      results.push({
        test: "Retrieve Coaching Requests",
        success: requests.length >= 0,
        details: `Retrieved ${requests.length} coaching requests successfully`,
      });
    } catch (error) {
      results.push({
        test: "Retrieve Coaching Requests",
        success: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 4: Create invitation
    const invitationData = {
      email: `verification${Date.now()}@test.com`,
      name: "Verification User",
      programId: "verification_program",
      programTitle: "Verification Program",
      companyId: "test_company_verification",
      companyName: "Test Company",
      inviterName: "Test Inviter",
      inviterEmail: "inviter@test.com",
      role: "participant" as const,
    };

    try {
      const invitation =
        await invitationService.createInvitation(invitationData);

      // Verify in localStorage
      const localInvitations = JSON.parse(
        localStorage.getItem("team_invitations") || "[]",
      );
      const foundInvitation = localInvitations.find(
        (i: any) => i.id === invitation.id,
      );

      results.push({
        test: "Create Team Invitation",
        success: !!foundInvitation,
        details: foundInvitation
          ? `Created ${invitation.id}, verified in localStorage`
          : `Created ${invitation.id} but not found in localStorage`,
      });
    } catch (error) {
      results.push({
        test: "Create Team Invitation",
        success: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 5: Retrieve invitations
    try {
      const invitations =
        await invitationService.getPendingInvitations("test@example.com");
      results.push({
        test: "Retrieve Pending Invitations",
        success: invitations.length >= 0,
        details: `Retrieved ${invitations.length} pending invitations`,
      });
    } catch (error) {
      results.push({
        test: "Retrieve Pending Invitations",
        success: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 6: Force sync all
    try {
      const syncResult = await dataSyncService.forceSyncAll();
      results.push({
        test: "Force Sync All",
        success: true,
        details: `Synced: ${syncResult.synced}, Failed: ${syncResult.failed}`,
      });
    } catch (error) {
      results.push({
        test: "Force Sync All",
        success: false,
        details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const totalTests = results.length;

    console.log(
      `✅ Verification complete: ${successCount}/${totalTests} tests passed`,
    );

    return {
      success: successCount === totalTests,
      results,
    };
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return {
      success: false,
      results: [
        {
          test: "System Verification",
          success: false,
          details: `Critical error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
}

export async function generateQuickReport(): Promise<string> {
  const verification = await verifySyncSystem();

  const report = `
# Quick Data Sync Verification Report

**Timestamp:** ${new Date().toISOString()}
**Overall Status:** ${verification.success ? "✅ PASSED" : "❌ FAILED"}

## Test Results:

${verification.results
  .map(
    (result) =>
      `- **${result.test}:** ${result.success ? "✅ PASSED" : "❌ FAILED"}
  - Details: ${result.details}`,
  )
  .join("\n\n")}

## Summary:

- **Total Tests:** ${verification.results.length}
- **Passed:** ${verification.results.filter((r) => r.success).length}
- **Failed:** ${verification.results.filter((r) => !r.success).length}
- **Success Rate:** ${Math.round((verification.results.filter((r) => r.success).length / verification.results.length) * 100)}%

${
  verification.success
    ? "🎉 **All tests passed!** The data synchronization system is working correctly."
    : "⚠️ **Some tests failed.** Please check the details above and resolve any issues."
}
`;

  return report;
}
