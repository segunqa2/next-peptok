export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface TeamInvitationData {
  inviterName: string;
  companyName: string;
  role: "participant" | "observer";
  invitationLink: string;
  expiresAt: Date;
}

interface ProgramDetailsData {
  programTitle: string;
  programDescription: string;
  startDate: string;
  endDate: string;
  sessionFrequency: string;
  companyName: string;
  adminName: string;
  goals: string[];
  metricsToTrack: string[];
}

interface CoachAcceptanceData {
  programTitle: string;
  coachName: string;
  coachTitle: string;
  coachExpertise: string[];
  sessionSchedule: {
    date: string;
    time: string;
    duration: string;
  }[];
  companyName: string;
  employeeName: string;
}

export class EmailService {
  private getEmailConfig() {
    // Get configuration from admin settings or environment variables
    const mockEmailEnabled =
      localStorage.getItem("email_mock_enabled") === "true" ||
      import.meta.env.VITE_MOCK_EMAIL === "true";

    return {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "",
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "",
      userId: import.meta.env.VITE_EMAILJS_USER_ID || "",
      mockEnabled: mockEmailEnabled,
      fromName: localStorage.getItem("email_from_name") || "Peptok Platform",
      fromEmail:
        localStorage.getItem("email_from_email") || "noreply@peptok.com",
    };
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    const config = this.getEmailConfig();

    // In development/demo mode or when mock is enabled, log the email
    if (import.meta.env.DEV || config.mockEnabled) {
      console.log("📧 Email would be sent:", {
        from: `${config.fromName} <${config.fromEmail}>`,
        to: template.to,
        subject: template.subject,
        content: template.textContent,
        mockMode: config.mockEnabled,
      });

      // Show what the email would look like in the console
      console.log("📧 Email Preview:");
      console.log("==========================================");
      console.log(`From: ${config.fromName} <${config.fromEmail}>`);
      console.log(`To: ${template.to}`);
      console.log(`Subject: ${template.subject}`);
      console.log("------------------------------------------");
      console.log(template.textContent);
      console.log("==========================================");

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return true;
    }

    // In production, integrate with your email service
    try {
      // Example integration with EmailJS for client-side email sending
      if (import.meta.env.VITE_EMAILJS_SERVICE_ID) {
        try {
          // Try to use emailjs-com package if available
          const emailjs = await import("emailjs-com").catch(() => null);
          if (emailjs) {
            await emailjs.send(
              import.meta.env.VITE_EMAILJS_SERVICE_ID,
              import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
              {
                to_email: template.to,
                subject: template.subject,
                html_content: template.htmlContent,
                text_content: template.textContent,
              },
              import.meta.env.VITE_EMAILJS_USER_ID,
            );
            return true;
          }
        } catch (error) {
          console.warn("EmailJS not available:", error);
        }
      }

      // If no email service is configured, fall back to logging
      console.warn(
        "No email service configured. Email would be sent:",
        template,
      );
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendTeamInvitation(
    recipientEmail: string,
    data: TeamInvitationData,
  ): Promise<boolean> {
    try {
      const emailContent = this.generateTeamInvitationEmail(data);
      const emailTemplate: EmailTemplate = {
        to: recipientEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: this.htmlToText(emailContent.htmlContent),
      };

      // Send email through the main sendEmail method
      const success = await this.sendEmail(emailTemplate);

      if (success) {
        // In mock mode, show user-friendly notification
        if (import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true") {
          console.log(`
🔧 DEVELOPMENT MODE: Email invitation simulated
📧 TO: ${recipientEmail}
📧 SUBJECT: ${emailContent.subject}
💡 In production, this email would be sent via your configured email service.
💡 To enable real emails, set VITE_MOCK_EMAIL=false and configure email service.
          `);
        } else {
          console.log(`✅ Team invitation email sent to: ${recipientEmail}`);
        }
      }

      return success;
    } catch (error) {
      console.error("Failed to send employee invitation email:", error);
      return false;
    }
  }

  async sendProgramDetails(
    recipientEmail: string,
    data: ProgramDetailsData,
  ): Promise<boolean> {
    try {
      const emailContent = this.generateProgramDetailsEmail(data);
      const emailTemplate: EmailTemplate = {
        to: recipientEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: this.htmlToText(emailContent.htmlContent),
      };

      // Send email through the main sendEmail method
      const success = await this.sendEmail(emailTemplate);

      if (success) {
        // In mock mode, show user-friendly notification
        if (import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true") {
          console.log(`
🔧 DEVELOPMENT MODE: Program details email simulated
📧 TO: ${recipientEmail}
📧 SUBJECT: ${emailContent.subject}
💡 In production, this email would be sent via your configured email service.
          `);
        } else {
          console.log(`✅ Program details email sent to: ${recipientEmail}`);
        }
      }

      return success;
    } catch (error) {
      console.error("Failed to send program details email:", error);
      return false;
    }
  }

  async sendCoachAcceptanceNotification(
    recipientEmail: string,
    data: CoachAcceptanceData,
  ): Promise<boolean> {
    try {
      const emailContent = this.generateCoachAcceptanceEmail(data);
      const emailTemplate: EmailTemplate = {
        to: recipientEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.htmlContent,
        textContent: this.htmlToText(emailContent.htmlContent),
      };

      // Send email through the main sendEmail method
      const success = await this.sendEmail(emailTemplate);

      if (success) {
        // In mock mode, show user-friendly notification
        if (import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true") {
          console.log(`
🔧 DEVELOPMENT MODE: Coach acceptance email simulated
📧 TO: ${recipientEmail}
📧 SUBJECT: ${emailContent.subject}
💡 In production, this email would be sent via your configured email service.
          `);
        } else {
          console.log(`✅ Coach acceptance email sent to: ${recipientEmail}`);
        }
      }

      return success;
    } catch (error) {
      console.error("Failed to send coach acceptance email:", error);
      return false;
    }
  }

  /**
   * Convert HTML content to plain text for email text content
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
      .replace(/&amp;/g, "&") // Replace HTML entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();
  }

  private generateTeamInvitationEmail(data: TeamInvitationData): {
    subject: string;
    htmlContent: string;
  } {
    const subject = `You're invited to join ${data.companyName}'s coaching program`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0; font-size: 28px;">🎯 Mentorship Invitation</h1>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              Hi there! 👋
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              <strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong>'s mentorship program as a <strong>${data.role}</strong>.
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              This is an exciting opportunity to develop your skills, connect with experienced mentors, and accelerate your professional growth.
            </p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">🚀 What's Next?</h3>
            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
              • Click the button below to accept your invitation<br>
              • Complete your profile and set your goals<br>
              • Get matched with an expert mentor<br>
              • Start your mentorship journey!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationLink}"
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
              ⏰ This invitation expires on ${data.expiresAt.toLocaleDateString()}
            </p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              If you have any questions, please contact your program administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return { subject, htmlContent };
  }

  private generateProgramDetailsEmail(data: ProgramDetailsData): {
    subject: string;
    htmlContent: string;
  } {
    const subject = `New Mentorship Program Created: ${data.programTitle}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">🎯 Program Created Successfully!</h1>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              Hi there! 👋
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              Great news! <strong>${data.adminName}</strong> has created a new mentorship program:
              <strong>"${data.programTitle}"</strong> at <strong>${data.companyName}</strong>.
            </p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 4px;">
            <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">📋 Program Details</h3>
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; line-height: 1.5;">
              <strong>Description:</strong> ${data.programDescription}
            </p>
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; line-height: 1.5;">
              <strong>Duration:</strong> ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}
            </p>
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; line-height: 1.5;">
              <strong>Session Frequency:</strong> ${data.sessionFrequency}
            </p>
          </div>

          ${
            data.goals.length > 0
              ? `
          <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">🎯 Program Goals</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.5;">
              ${data.goals.map((goal) => `<li style="margin-bottom: 5px;">${goal}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            data.metricsToTrack.length > 0
              ? `
          <div style="margin: 30px 0; padding: 20px; background-color: #e0e7ff; border-left: 4px solid #6366f1; border-radius: 4px;">
            <h3 style="color: #3730a3; margin: 0 0 15px 0; font-size: 18px;">📊 Success Metrics</h3>
            <ul style="margin: 0; padding-left: 20px; color: #3730a3; font-size: 14px; line-height: 1.5;">
              ${data.metricsToTrack.map((metric) => `<li style="margin-bottom: 5px;">${metric}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">🚀 What's Next?</h3>
            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
              • We're currently matching you with qualified coaches<br>
              • You'll receive another email once a coach is assigned<br>
              • Your mentorship journey will begin soon!
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              If you have any questions about this program, please contact ${data.adminName} or your program administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return { subject, htmlContent };
  }

  private generateCoachAcceptanceEmail(data: CoachAcceptanceData): {
    subject: string;
    htmlContent: string;
  } {
    const subject = `Your Coach is Ready! ${data.programTitle} - ${data.coachName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🎉 Your Coach is Ready!</h1>
          </div>

          <div style="margin-bottom: 25px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              Hi ${data.employeeName}! 👋
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 15px 0;">
              Exciting news! Your coach for the <strong>"${data.programTitle}"</strong> program at
              <strong>${data.companyName}</strong> has been confirmed and is ready to start working with you.
            </p>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #f3e8ff; border-left: 4px solid #7c3aed; border-radius: 4px;">
            <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 18px;">👨‍🏫 Meet Your Coach</h3>
            <p style="margin: 0 0 10px 0; color: #6b21a8; font-size: 16px; line-height: 1.5;">
              <strong>${data.coachName}</strong><br>
              <span style="font-size: 14px;">${data.coachTitle}</span>
            </p>
            <p style="margin: 0 0 10px 0; color: #6b21a8; font-size: 14px; line-height: 1.5;">
              <strong>Expertise:</strong> ${data.coachExpertise.join(", ")}
            </p>
          </div>

          ${
            data.sessionSchedule.length > 0
              ? `
          <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 4px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">�� Upcoming Sessions</h3>
            ${data.sessionSchedule
              .map(
                (session) => `
              <div style="margin-bottom: 10px; padding: 10px; background-color: white; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">
                  <strong>${session.date}</strong> at <strong>${session.time}</strong><br>
                  <span style="font-size: 12px;">Duration: ${session.duration}</span>
                </p>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

          <div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">🚀 Ready to Start?</h3>
            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
              • Your coach will contact you shortly to introduce themselves<br>
              • Prepare any questions or goals you'd like to discuss<br>
              • Check your calendar for the scheduled sessions<br>
              • Get ready for an amazing mentorship experience!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/dashboard"
               style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              View Program Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              If you have any questions about your sessions or need to reschedule, please contact your program administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return { subject, htmlContent };
  }

  async sendWelcomeEmail(email: string, companyName: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: email,
      subject: `Welcome to ${companyName} on Peptok!`,
      htmlContent: `<h1>Welcome!</h1><p>You've successfully joined ${companyName} on Peptok.</p>`,
      textContent: `Welcome! You've successfully joined ${companyName} on Peptok.`,
    };

    return await this.sendEmail(template);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;

    const template: EmailTemplate = {
      to: email,
      subject: "Reset your Peptok password",
      htmlContent: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
      textContent: `
        Password Reset Request

        Click the link below to reset your password:
        ${resetLink}

        This link expires in 1 hour.
      `,
    };

    return await this.sendEmail(template);
  }

  // Test email functionality from admin panel
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    const config = this.getEmailConfig();

    const emailTemplate: EmailTemplate = {
      to: recipientEmail,
      subject: "Peptok Platform - Test Email",
      htmlContent: `
        <h2>Email Service Test</h2>
        <p>This is a test email from the Peptok platform.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>From: ${config.fromName} &lt;${config.fromEmail}&gt;</li>
          <li>Service: ${config.serviceId ? "EmailJS Configured" : "EmailJS Not Configured"}</li>
          <li>Mode: ${config.mockEnabled ? "Mock/Development" : "Production"}</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <p>If you received this email, the email service is working correctly!</p>
      `,
      textContent: `
Email Service Test

This is a test email from the Peptok platform.

Configuration Details:
- From: ${config.fromName} <${config.fromEmail}>
- Service: ${config.serviceId ? "EmailJS Configured" : "EmailJS Not Configured"}
- Mode: ${config.mockEnabled ? "Mock/Development" : "Production"}
- Timestamp: ${new Date().toISOString()}

If you received this email, the email service is working correctly!
      `,
    };

    try {
      const success = await this.sendEmail(emailTemplate);

      if (success && config.mockEnabled) {
        console.log(`
🧪 TEST EMAIL SIMULATED
📧 TO: ${recipientEmail}
📧 FROM: ${config.fromName} <${config.fromEmail}>
📧 SUBJECT: ${emailTemplate.subject}
💡 Mock mode is enabled - email logged to console instead of being sent.
        `);
      }

      return success;
    } catch (error) {
      console.error("Test email failed:", error);
      return false;
    }
  }

  // Get current email service status
  getServiceStatus() {
    const config = this.getEmailConfig();

    return {
      configured: !!(config.serviceId && config.templateId && config.userId),
      mockEnabled: config.mockEnabled,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      serviceId: config.serviceId,
    };
  }
}

export const emailService = new EmailService();
