import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  Building2,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  invitationService,
  type TeamInvitation,
} from "@/services/invitationService";
import { useAuth } from "@/contexts/AuthContext";

export default function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  useEffect(() => {
    loadInvitation();
  }, [searchParams]);

  const loadInvitation = async () => {
    const token = searchParams.get("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const invitationData =
        await invitationService.getInvitationByToken(token);
      setInvitation(invitationData);
    } catch (error) {
      console.error("Failed to load invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsAccepting(true);

    try {
      const result = await invitationService.acceptInvitation(
        invitation.token,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          password: formData.password,
          acceptTerms: formData.acceptTerms,
        },
      );

      if (result.success && result.user) {
        // Auto-login the new user
        await login(result.user.email, formData.password);

        toast.success(
          `Welcome to ${invitation.companyName}, ${formData.firstName}!`,
        );
        navigate("/team-member/dashboard");
      } else {
        toast.error(result.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("Failed to accept invitation. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    try {
      const success = await invitationService.declineInvitation(
        invitation.token,
      );
      if (success) {
        toast.success("Invitation declined");
      } else {
        toast.error("Failed to decline invitation");
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      toast.error("Failed to decline invitation");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (
    invitation.status === "expired" ||
    new Date() > new Date(invitation.expiresAt)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation expired on{" "}
              {new Date(invitation.expiresAt).toLocaleDateString()}. Please
              contact {invitation.inviterName} for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Invitation Already Accepted</CardTitle>
            <CardDescription>
              This invitation has already been accepted. If you need access,
              please contact {invitation.inviterName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "declined") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <CardTitle>Invitation Declined</CardTitle>
            <CardDescription>
              This invitation was previously declined. If you've changed your
              mind, please contact {invitation.inviterName} for a new
              invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              Join {invitation.companyName} on Peptok
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invitation Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      <strong>{invitation.inviterName}</strong> has invited you
                      to join
                    </span>
                  </div>
                  <h3 className="font-semibold text-blue-900">
                    {invitation.programTitle}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        Role: <strong>{invitation.role}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{invitation.companyName}</span>
                    </div>
                  </div>
                  {invitation.metadata?.programDescription && (
                    <p className="text-sm text-blue-700 mt-2">
                      {invitation.metadata.programDescription}
                    </p>
                  )}
                  {invitation.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {invitation.metadata.startDate && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          Starts{" "}
                          {new Date(
                            invitation.metadata.startDate,
                          ).toLocaleDateString()}
                        </Badge>
                      )}
                      {invitation.metadata.duration && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {invitation.metadata.duration}
                        </Badge>
                      )}
                      {invitation.metadata.sessionCount && (
                        <Badge variant="secondary" className="text-xs">
                          {invitation.metadata.sessionCount} sessions
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Create a password (min. 8 characters)"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      acceptTerms: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  I accept the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </Label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                className="flex-1"
              >
                Decline
              </Button>
              <Button
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="flex-1"
              >
                {isAccepting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Accept & Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 space-y-1">
              <div>
                Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
              </div>
              <div className="text-xs">
                Invited by {invitation.inviterName} • {invitation.companyName}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
