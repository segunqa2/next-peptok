import { emailService } from "@/services/email";

// Demo functions to test email functionality
export const demoEmailFunctions = {
  async sendTestInvitation() {
    const testEmail = "test@example.com";
    const invitationData = {
      inviterName: "John Smith",
      companyName: "Demo Company",
      role: "participant" as const,
      invitationLink: "",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    console.log("🧪 Sending test invitation email...");
    const result = await emailService.sendTeamInvitation(
      testEmail,
      invitationData,
    );

    if (result) {
      console.log("✅ Test invitation sent successfully!");
      console.log(
        "📧 In a real application, an email would be delivered to:",
        testEmail,
      );
    } else {
      console.log("❌ Test invitation failed");
    }

    return result;
  },

  async sendTestWelcome() {
    const testEmail = "welcome@example.com";
    const companyName = "Demo Company";

    console.log("🧪 Sending test welcome email...");
    const result = await emailService.sendWelcomeEmail(testEmail, companyName);

    if (result) {
      console.log("✅ Test welcome email sent successfully!");
    } else {
      console.log("❌ Test welcome email failed");
    }

    return result;
  },

  showEmailSettings() {
    console.log("📧 Email Service Settings:");
    console.log("==========================");
    console.log("Mock Mode:", import.meta.env.VITE_MOCK_EMAIL || "true");
    console.log(
      "EmailJS Service ID:",
      import.meta.env.VITE_EMAILJS_SERVICE_ID || "Not configured",
    );
    console.log(
      "EmailJS Template ID:",
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "Not configured",
    );
    console.log(
      "EmailJS User ID:",
      import.meta.env.VITE_EMAILJS_USER_ID || "Not configured",
    );
    console.log("==========================");
    console.log("💡 To use real email sending:");
    console.log("1. Sign up for EmailJS (https://emailjs.com)");
    console.log("2. Set VITE_EMAILJS_* environment variables");
    console.log("3. Set VITE_MOCK_EMAIL=false");
  },
};

// Make functions available globally in development
if (import.meta.env.DEV) {
  (window as any).testEmail = demoEmailFunctions.sendTestInvitation;
  (window as any).testWelcome = demoEmailFunctions.sendTestWelcome;
  (window as any).emailSettings = demoEmailFunctions.showEmailSettings;

  console.log("📧 Email Demo Functions Available:");
  console.log("- testEmail() - Send test invitation email");
  console.log("- testWelcome() - Send test welcome email");
  console.log("- emailSettings() - Show email configuration");
}
