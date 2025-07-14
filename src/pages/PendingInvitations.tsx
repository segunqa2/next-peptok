import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Search,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  invitationService,
  type TeamInvitation,
} from "@/services/invitationService";
import Header from "@/components/layout/Header";
import { initializeSampleData } from "@/utils/sampleDataInitializer";

export default function PendingInvitations() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize sample data for testing
  useEffect(() => {
    initializeSampleData();
  }, []);

  const handleSearchInvitations = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const pendingInvitations = await invitationService.getPendingInvitations(
        email.toLowerCase(),
      );

      // Ensure pendingInvitations is always an array
      const safeInvitations = Array.isArray(pendingInvitations)
        ? pendingInvitations
        : [];
      setInvitations(safeInvitations);

      if (safeInvitations.length === 0) {
        toast.info("No pending invitations found for this email address");
      } else {
        toast.success(
          `Found ${safeInvitations.length} pending invitation${safeInvitations.length > 1 ? "s" : ""}`,
        );
      }
    } catch (error) {
      console.error("Failed to search invitations:", error);
      setInvitations([]); // Ensure invitations is set to empty array on error
      toast.error("Failed to search for invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = (invitation: TeamInvitation) => {
    navigate(`/invitation/accept?token=${invitation.token}`);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires tomorrow";
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return `Expires ${expiry.toLocaleDateString()}`;
  };

  const getUrgencyColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "text-red-600 bg-red-50 border-red-200";
    if (diffDays <= 2) return "text-orange-600 bg-orange-50 border-orange-200";
    if (diffDays <= 7) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Check Your Invitations
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enter your email address to see any pending team invitations. If
              you've been invited to join a mentorship program, you'll find all
              the details here.
            </p>
          </div>

          {/* Search Form */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Find Your Invitations
              </CardTitle>
              <CardDescription>
                Enter the email address where you received your invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSearchInvitations()
                  }
                />
              </div>
              <Button
                onClick={handleSearchInvitations}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>Search Invitations</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {hasSearched && (
            <div className="space-y-6">
              {invitations.length === 0 ? (
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Invitations Found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No pending invitations were found for{" "}
                      <strong>{email}</strong>
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>• Double-check your email address for typos</p>
                      <p>• Check if you've already accepted the invitation</p>
                      <p>
                        • Contact your team administrator if you're expecting an
                        invitation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 text-center">
                    Your Pending Invitations (
                    {Array.isArray(invitations) ? invitations.length : 0})
                  </h2>

                  <div className="grid gap-4">
                    {Array.isArray(invitations) &&
                      invitations.map((invitation) => (
                        <Card key={invitation.id} className="max-w-2xl mx-auto">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {invitation.programTitle}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building2 className="w-4 h-4" />
                                    {invitation.companyName}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={getUrgencyColor(
                                    invitation.expiresAt,
                                  )}
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTimeRemaining(invitation.expiresAt)}
                                </Badge>
                              </div>

                              {/* Invitation Details */}
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                      Role: <strong>{invitation.role}</strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                      From:{" "}
                                      <strong>{invitation.inviterName}</strong>
                                    </span>
                                  </div>
                                </div>

                                {invitation.metadata && (
                                  <div className="flex flex-wrap gap-2">
                                    {invitation.metadata.startDate && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Starts{" "}
                                        {new Date(
                                          invitation.metadata.startDate,
                                        ).toLocaleDateString()}
                                      </Badge>
                                    )}
                                    {invitation.metadata.duration && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        <Clock className="w-3 h-3 mr-1" />
                                        {invitation.metadata.duration}
                                      </Badge>
                                    )}
                                    {invitation.metadata.sessionCount && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {invitation.metadata.sessionCount}{" "}
                                        sessions
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {invitation.metadata?.programDescription && (
                                  <p className="text-sm text-gray-700">
                                    {invitation.metadata.programDescription}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex justify-end">
                                <Button
                                  onClick={() =>
                                    handleAcceptInvitation(invitation)
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Accept Invitation
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Section */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Can't find your invitation?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure you're using the correct email address</li>
                  <li>Contact your team administrator for assistance</li>
                  <li>Ask them to resend the invitation if it has expired</li>
                </ul>
              </div>
              <Separator />
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Already have an account?</strong>
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => navigate("/login")}
                >
                  Sign in to your account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
