import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  FileText,
  Shield,
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";

export default function Terms() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: <FileText className="w-5 h-5" />,
      content: `By accessing and using this coaching platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement, including all pricing, payment, and refund policies outlined herein. If you do not agree to abide by the above, please do not use this service.

These Terms of Service govern your use of our platform and form a legally binding agreement between you and our company. By booking coaching sessions or providing coaching services, you acknowledge understanding of our session-based pricing structure, commission rates, and fee policies.

PRICING ACKNOWLEDGMENT:
• All prices listed are in Canadian Dollars (CAD)
• Session pricing subject to change with 30-day notice
• For Companies: 10% service fee applies to all session bookings
• For Coaches: 20% commission applies to all earnings
• Additional participant fees ($25 CAD) apply beyond first participant

Please read these terms carefully before using our services, especially the payment and refund sections.

Last updated: ${new Date().toLocaleDateString()}`,
    },
    {
      id: "definitions",
      title: "2. Definitions",
      icon: <Users className="w-5 h-5" />,
      content: `For the purposes of these Terms:

• "Platform" refers to our coaching matching and connection service
• "Coach" refers to professional mentors providing coaching services
• "Client" refers to individuals or companies seeking coaching services
• "Session" refers to coaching meetings conducted through our platform
• "Content" refers to all materials, information, and data on the platform
• "Account" refers to your registered user profile and access credentials`,
    },
    {
      id: "registration",
      title: "3. User Registration and Accounts",
      icon: <Shield className="w-5 h-5" />,
      content: `To use our Service, you must:

• Be at least 18 years old or have legal guardian consent
• Provide accurate, current, and complete information during registration
• Maintain and update your account information
• Keep your login credentials secure and confidential
• Notify us immediately of any unauthorized use of your account

You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      id: "services",
      title: "4. Platform Services",
      icon: <Scale className="w-5 h-5" />,
      content: `Our platform provides:

• Matching services between coaches and clients
• Video conferencing and communication tools
• Session scheduling and management
• Progress tracking and analytics
• Payment processing and invoicing
• Educational resources and materials

We strive to maintain service availability but do not guarantee uninterrupted access. Maintenance windows and service updates may temporarily affect availability.`,
    },
    {
      id: "payments",
      title: "5. Payment Terms",
      icon: <CreditCard className="w-5 h-5" />,
      content: `SESSION-BASED PRICING:

FOR COMPANIES:
• Coach-set hourly rates (typically $100-300 CAD/hour)
• Additional participants: $25 CAD per person beyond first participant
• Platform service fee: 10% of total session cost
• Includes session recordings, progress tracking, and platform support

FOR COACHES:
• Set your own hourly rates
• Platform commission: 20% of session earnings
• Payment processing within 7 business days after session completion
• Access to client matching, scheduling tools, and platform features

Extended Sessions Available:
• 30-minute, 60-minute, 90-minute, or 2-hour sessions
• Group sessions supported with additional participant pricing
• Custom session lengths available by arrangement

Enterprise Packages:
• Bulk session packages available for companies
• Volume discounts for 10+ sessions booked in advance
• Custom coaching programs with dedicated support
• Contact us for enterprise pricing

PAYMENT PROCESSING:

• All payments processed securely through certified payment partners
• Coach payments: Processed weekly for completed sessions
• Company billing: Charged immediately upon session booking
• Platform fees/commissions: Automatically calculated and applied
• Currency: All prices in Canadian Dollars (CAD) unless specified
• Refunds: Available according to cancellation policy outlined below
• Price changes: 30 days advance notice for rate modifications`,
    },
    {
      id: "content",
      title: "6. Content and Intellectual Property",
      icon: <FileText className="w-5 h-5" />,
      content: `Content Ownership:

• You retain ownership of content you create and upload
• By using our platform, you grant us a license to use your content for service provision
• We respect intellectual property rights and respond to valid DMCA notices
• Our platform design, software, and proprietary content remain our property

User-Generated Content:
• You are responsible for the content you share
• Content must not violate any laws or these terms
• We reserve the right to remove inappropriate content`,
    },
    {
      id: "conduct",
      title: "7. User Conduct and Prohibited Activities",
      icon: <AlertTriangle className="w-5 h-5" />,
      content: `Prohibited Activities include:

• Harassment, abuse, or discrimination of any kind
• Sharing false, misleading, or harmful information
• Attempting to circumvent platform security measures
• Using the platform for illegal activities
• Spam, phishing, or unsolicited commercial communications
• Impersonating other users or entities
• Sharing login credentials or account access

Violations may result in account suspension or termination without refund.`,
    },
    {
      id: "privacy",
      title: "8. Privacy and Data Protection",
      icon: <Shield className="w-5 h-5" />,
      content: `We take privacy seriously:

• Your personal information is protected according to our Privacy Policy
• We comply with applicable data protection laws (GDPR, CCPA, etc.)
• Session recordings are stored securely and deleted as per retention policies
• We do not sell your personal information to third parties
• You can request data deletion or export at any time

For detailed privacy information, please review our Privacy Policy.`,
    },
    {
      id: "liability",
      title: "9. Limitation of Liability",
      icon: <Scale className="w-5 h-5" />,
      content: `PLATFORM SERVICE ARRANGEMENT:

• We facilitate connections between coaches and clients through our platform
• For companies: 10% service fee covers technology, support, and administrative costs
• For coaches: 20% commission covers client acquisition, payment processing, and platform access
• We are not responsible for the quality or results of individual coaching services
• Coaches are independent contractors providing professional services
• We provide the platform technology "as is" without warranties of coaching outcomes

FINANCIAL RESPONSIBILITY:

• Session fees are final once session is completed
• Platform service charges and commissions are non-refundable processing fees
• Enterprise custom packages subject to separate contract terms
• No recurring billing or automatic charges beyond booked sessions
LIABILITY LIMITATIONS:

• Our liability is limited to the amount paid for sessions in the last 12 months
• Maximum liability per incident: $10,000 CAD
• We are not liable for indirect, incidental, or consequential damages
• Not responsible for coach-client relationship outcomes or disputes
• Platform downtime exceeding 24 hours may qualify for service credits
• Some jurisdictions do not allow liability limitations, so these may not apply to you

DISPUTE RESOLUTION:

• Payment disputes must be reported within 30 days of charge
• Coaching quality concerns handled through our resolution process
• Platform technical issues eligible for service credits as appropriate`,
    },
    {
      id: "termination",
      title: "10. Termination & Refunds",
      icon: <Clock className="w-5 h-5" />,
      content: `SESSION CANCELLATION POLICY:

• 24+ hours notice: Full refund minus 5% processing fee
• 2-24 hours notice: 50% refund (coach compensation policy)
• Less than 2 hours: No refund (coach time reserved)
• Coach-initiated cancellations: Full refund plus scheduling priority
• Rescheduling: Free rescheduling available with 24+ hours notice

BULK SESSION PACKAGES:

• Enterprise packages: Refund policies specified in custom contract
��� Prepaid sessions: Unused sessions refundable within 90 days of purchase
• Volume discounts: Non-refundable discount amounts, base session fees refundable

ACCOUNT TERMINATION:

• Self-termination: Available through account settings anytime
• Platform termination: For terms violations with 30-day notice when possible
• Data retention: Essential information kept for legal/business purposes (7 years)
• Outstanding session fees: All charges due within 30 days

REFUND PROCESSING:

• Session refunds: 3-5 business days to original payment method
• Platform service fees/commissions: Non-refundable (10% for companies, 20% for coaches)
• Currency conversion fees: Customer responsibility for international payments
• Processing fees: 5% processing fee applies to all refunds

POST-TERMINATION EFFECTS:

• Platform access: Immediate removal upon termination
• Coach relationships: May continue independently outside platform
• Data export: Available for 30 days after termination
• Outstanding payments: Remain due regardless of termination status
• Booked sessions: May be completed or cancelled according to cancellation policy`,
    },
    {
      id: "changes",
      title: "11. Changes to Terms",
      icon: <FileText className="w-5 h-5" />,
      content: `We may update these Terms of Service:

• Changes will be posted on this page with the updated date
• Significant changes will be communicated via email or platform notification
• Continued use of the platform constitutes acceptance of updated terms
• If you disagree with changes, you may terminate your account

We encourage regular review of these terms to stay informed of any updates.`,
    },
    {
      id: "contact",
      title: "12. Contact Information",
      icon: <Users className="w-5 h-5" />,
      content: `For questions about these Terms of Service:

Email: legal@peptok.ca (Legal Department - Terms of Service)
Phone: +1 (555) 123-4567
Address: 123 Business Street, Suite 100, City, State 12345

Support Hours: Monday-Friday, 9 AM - 6 PM EST

For technical support, please use the in-platform support system or contact support@peptok.ca (Technical Support Department).
For general inquiries: info@peptok.ca (General Information Department)`,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Scale className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Terms of Service
                </h1>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These terms govern your use of our coaching platform. Please
                read them carefully to understand your rights and
                responsibilities.
              </p>
              <Badge variant="outline" className="mt-4">
                Last Updated: {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Quick Navigation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      document
                        .getElementById(section.id)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="justify-start"
                  >
                    {section.icon}
                    <span className="ml-2 text-xs">{section.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card
                key={section.id}
                id={section.id}
                className="overflow-hidden"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span>{section.title}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedSection === section.id ? "−" : "+"}
                    </Button>
                  </CardTitle>
                </CardHeader>

                {expandedSection === section.id && (
                  <CardContent className="border-t">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                        {section.content}
                      </pre>
                    </div>
                  </CardContent>
                )}

                {index < sections.length - 1 && <Separator />}
              </Card>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-12 text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Questions about our Terms?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Contact our legal team for clarification or assistance
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button>
                      <Users className="w-4 h-4 mr-2" />
                      Contact Legal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
