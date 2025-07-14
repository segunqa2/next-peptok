import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h2>Information We Collect</h2>
              <p>
                When you use our coaching platform, we collect information that
                helps us provide and improve our services:
              </p>
              <ul>
                <li>
                  <strong>Account Information:</strong> Name, email address,
                  company information, and professional details
                </li>
                <li>
                  <strong>Profile Data:</strong> Skills, expertise areas, goals,
                  and coaching preferences
                </li>
                <li>
                  <strong>Usage Data:</strong> How you interact with our
                  platform, session attendance, and progress metrics
                </li>
                <li>
                  <strong>Communication Data:</strong> Messages, feedback, and
                  support interactions
                </li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>
                  Provide coaching matching and program management services
                </li>
                <li>Facilitate communication between coaches and clients</li>
                <li>
                  Track progress and generate analytics for program
                  effectiveness
                </li>
                <li>Send important platform updates and notifications</li>
                <li>Improve our services and user experience</li>
              </ul>

              <h2>Information Sharing</h2>
              <p>
                We respect your privacy and do not sell your personal
                information. We may share your information:
              </p>
              <ul>
                <li>
                  With your coach or client as part of the coaching program
                </li>
                <li>
                  With your company administrator for program management
                  purposes
                </li>
                <li>With service providers who help us operate our platform</li>
                <li>When required by law or to protect our rights</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. This includes encryption, secure
                data transmission, and access controls.
              </p>

              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access and review your personal information</li>
                <li>Update or correct your information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of non-essential communications</li>
                <li>Export your data in a portable format</li>
              </ul>

              <h2>Data Retention</h2>
              <p>
                We retain your information for as long as your account is active
                or as needed to provide services. After account deletion, we may
                retain certain information for legal compliance and legitimate
                business purposes.
              </p>

              <h2>Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your
                experience, remember your preferences, and analyze platform
                usage. You can control cookie settings through your browser.
              </p>

              <h2>Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will
                notify you of significant changes through email or platform
                notifications.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have questions about this privacy policy or our data
                practices, please contact us:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong> privacy@peptok.ca
                </li>
                <li>
                  <strong>Address:</strong> Peptok Inc., Toronto, ON, Canada
                </li>
                <li>
                  <strong>Phone:</strong> +1 (555) 123-4567
                </li>
              </ul>

              <p className="text-sm text-muted-foreground mt-8">
                This privacy policy is part of our commitment to protecting your
                privacy and ensuring transparency in how we handle your personal
                information.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
