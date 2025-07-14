import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Mail,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { TeamMember } from "@/types";
import { toast } from "sonner";
import { emailService } from "@/services/email";
import { invitationService } from "@/services/invitationService";
import { apiEnhanced as offlineApi } from "@/services/apiEnhanced";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface TeamMemberManagementCardProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (teamMembers: TeamMember[]) => void;
  programTitle?: string;
  programId?: string;
  className?: string;
  readOnly?: boolean;
}

export function TeamMemberManagementCard({
  teamMembers,
  onUpdateTeamMembers,
  programTitle = "Coaching Program",
  programId,
  className,
  readOnly = false,
}: TeamMemberManagementCardProps) {
  const { user } = useAuth();
  const { isOnline, executeOffline } = useOfflineSync();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "participant" | "observer"
  >("participant");
  const [isInviting, setIsInviting] = useState(false);
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());

  const addTeamMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (
      teamMembers.some(
        (member) => member.email.toLowerCase() === newMemberEmail.toLowerCase(),
      )
    ) {
      toast.error("This team member is already added to the program");
      return;
    }

    setIsInviting(true);

    try {
      // Create invitation using offline-enabled API
      const invitation = await offlineApi.createTeamInvitation(
        {
          email: newMemberEmail.toLowerCase(),
          name: newMemberName.trim() || undefined,
          programId: programId || `program-${Date.now()}`,
          programTitle: programTitle || "Coaching Program",
          companyId: user?.companyId || `company-${Date.now()}`,
          companyName: user?.businessDetails?.companyName || "Your Company",
          inviterName: user
            ? `${user.firstName} ${user.lastName}`
            : "Your program administrator",
          inviterEmail: user?.email || "admin@company.com",
          role: newMemberRole,
          metadata: {
            programDescription: `Join our ${programTitle} coaching program`,
            sessionCount: 8,
            duration: "8 weeks",
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 8 * 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
        {
          priority: "high",
          maxRetries: 5,
        },
      );

      // Create new team member entry
      const newTeamMember: TeamMember = {
        id: `member-${Date.now()}`,
        email: newMemberEmail.toLowerCase(),
        name: newMemberName.trim() || undefined,
        role: newMemberRole,
        status: "invited",
        invitedAt: new Date().toISOString(),
      };

      // Add to team members list
      onUpdateTeamMembers([...teamMembers, newTeamMember]);

      // Reset form
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberRole("participant");

      // Development helper
      if (import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true") {
        console.log("👥 Team Member Added Successfully:", {
          email: newTeamMember.email,
          name: newTeamMember.name,
          role: newTeamMember.role,
          programId: programId,
          status: "invited",
          note: "Email invitation simulated in development mode. Check console for email content.",
        });
      }

      // Check if emails are in mock mode
      const isMockEmail =
        import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true";

      if (isMockEmail) {
        toast.success(`��� Team member added to program: ${newMemberEmail}`, {
          description:
            "🔧 Development Mode: Email invitation simulated. In production, they would receive an email to join the program.",
          duration: 7000,
        });
      } else {
        toast.success(
          `✅ Team member invitation ${isOnline ? "sent" : "queued"} for ${newMemberEmail}! ${isOnline ? "They will receive an email to join the program." : "Will be sent when back online."}`,
          { duration: 5000 },
        );
      }
    } catch (error) {
      console.error("Failed to add team member:", error);
      toast.error("Failed to send invitation email. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const removeTeamMember = (memberId: string) => {
    const member = teamMembers.find((member) => member.id === memberId);
    if (member) {
      onUpdateTeamMembers(
        teamMembers.filter((member) => member.id !== memberId),
      );
      toast.success(`Removed ${member.email} from the program`);
    }
  };

  const resendAllInvitations = async () => {
    const pendingMembers = teamMembers.filter(
      (member) => member.status === "invited",
    );

    if (pendingMembers.length === 0) {
      toast.info("No pending invitations to resend");
      return;
    }

    // Confirm bulk action
    const confirmed = window.confirm(
      `Are you sure you want to resend invitations to all ${pendingMembers.length} pending team members?`,
    );

    if (!confirmed) return;

    let successCount = 0;
    let failureCount = 0;

    // Process each invitation
    for (const member of pendingMembers) {
      try {
        await resendInvitation(member.id);
        successCount++;
      } catch (error) {
        failureCount++;
      }
    }

    // Show summary toast
    if (successCount > 0 && failureCount === 0) {
      toast.success(`✅ Successfully resent ${successCount} invitations`, {
        description: "All team members will receive fresh invitation emails",
        duration: 5000,
      });
    } else if (successCount > 0 && failureCount > 0) {
      toast.warning(
        `⚠️ Resent ${successCount} invitations, ${failureCount} failed`,
        {
          description: "Please try again for the failed invitations",
          duration: 5000,
        },
      );
    } else {
      toast.error(`❌ Failed to resend invitations`, {
        description: "Please check your connection and try again",
      });
    }
  };

  const updateMemberRole = (
    memberId: string,
    newRole: "participant" | "observer",
  ) => {
    const updatedMembers = teamMembers.map((member) =>
      member.id === memberId ? { ...member, role: newRole } : member,
    );
    onUpdateTeamMembers(updatedMembers);
    toast.success("Team member role updated successfully");
  };

  const resendInvitation = async (memberId: string) => {
    const member = teamMembers.find((member) => member.id === memberId);
    if (!member) return;

    // Add to resending set
    setResendingIds((prev) => new Set(prev).add(memberId));

    try {
      // Find the invitation and resend it
      const invitations = await invitationService.getInvitations({
        companyId: user?.companyId,
      });
      const invitation = invitations.find((inv) => inv.email === member.email);

      if (invitation) {
        const success = await offlineApi.resendTeamInvitation(invitation.id, {
          priority: "medium",
          maxRetries: 3,
        });
        if (success) {
          const isMockEmail =
            import.meta.env.DEV || import.meta.env.VITE_MOCK_EMAIL === "true";

          if (isMockEmail) {
            toast.success(
              `✅ Invitation resend simulated for ${member.email}`,
              {
                description:
                  "🔧 Development Mode: In production, they would receive a new email with a fresh 7-day link",
                duration: 5000,
              },
            );
          } else {
            toast.success(
              `✅ Invitation ${isOnline ? "resent" : "queued for resend"} to ${member.email}`,
              {
                description: isOnline
                  ? "They will receive a new email with a fresh 7-day link"
                  : "Will be sent when back online",
                duration: 4000,
              },
            );
          }

          // Update the member's invitedAt time to reflect the resend
          const updatedMembers = teamMembers.map((m) =>
            m.id === memberId
              ? { ...m, invitedAt: new Date().toISOString() }
              : m,
          );
          onUpdateTeamMembers(updatedMembers);
        } else {
          throw new Error("Failed to resend invitation");
        }
      } else {
        // Create new invitation if original not found
        await invitationService.createInvitation({
          email: member.email,
          name: member.name,
          programId: programId || `program-${Date.now()}`,
          programTitle: programTitle || "Coaching Program",
          companyId: user?.companyId || `company-${Date.now()}`,
          companyName: user?.businessDetails?.companyName || "Your Company",
          inviterName: user
            ? `${user.firstName} ${user.lastName}`
            : "Your program administrator",
          inviterEmail: user?.email || "admin@company.com",
          role: member.role,
        });

        toast.success(`✅ New invitation sent to ${member.email}`, {
          description: "They will receive an email to join the program",
          duration: 4000,
        });

        // Update the member's invitedAt time
        const updatedMembers = teamMembers.map((m) =>
          m.id === memberId ? { ...m, invitedAt: new Date().toISOString() } : m,
        );
        onUpdateTeamMembers(updatedMembers);
      }
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      toast.error(`❌ Failed to resend invitation to ${member.email}`, {
        description:
          "Please try again or contact support if the issue persists",
      });
    } finally {
      // Remove from resending set
      setResendingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "invited":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "declined":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "default" as const;
      case "invited":
        return "secondary" as const;
      case "declined":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Program Team Members
          <Badge variant="outline" className="ml-auto">
            {teamMembers.length} members
          </Badge>
        </CardTitle>
        <CardDescription>
          Add team members to participate in "{programTitle}". Each team member
          will receive an invitation email with program details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Team Member */}
        {!readOnly && (
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50 border-blue-200">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Add Team Member to Program
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberEmail">Email Address *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="member@company.com"
                  onKeyPress={(e) => e.key === "Enter" && addTeamMember()}
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberName">Full Name (Optional)</Label>
                <Input
                  id="memberName"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="memberRole">Role in Program</Label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value: "participant" | "observer") =>
                    setNewMemberRole(value)
                  }
                  disabled={isInviting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium">Participant</div>
                          <div className="text-xs text-muted-foreground">
                            Actively participate in coaching sessions
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="observer">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Observer</div>
                          <div className="text-xs text-muted-foreground">
                            View sessions and materials, limited participation
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={addTeamMember}
                disabled={isInviting || !newMemberEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isInviting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Inviting Team Member...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team Member
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Current Team Members */}
        {teamMembers.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Program Team Members ({teamMembers.length})
              </h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  {
                    teamMembers.filter((member) => member.status === "accepted")
                      .length
                  }{" "}
                  accepted,{" "}
                  {
                    teamMembers.filter((member) => member.status === "invited")
                      .length
                  }{" "}
                  pending
                </div>
                {!readOnly &&
                  teamMembers.filter((member) => member.status === "invited")
                    .length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resendAllInvitations}
                      disabled={resendingIds.size > 0}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      {resendingIds.size > 0 ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-2" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3 mr-2" />
                          Resend All
                        </>
                      )}
                    </Button>
                  )}
              </div>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${member.email}`}
                      />
                      <AvatarFallback>
                        {member.name
                          ? member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : member.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-medium">
                        {member.name || member.email}
                      </div>
                      {member.name && (
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      )}
                      {member.status === "invited" && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Invited{" "}
                            {new Date(member.invitedAt).toLocaleDateString()}
                            {(() => {
                              const daysSince = Math.floor(
                                (Date.now() -
                                  new Date(member.invitedAt).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              const daysLeft = Math.max(0, 7 - daysSince);

                              if (daysLeft === 0) {
                                return (
                                  <span className="text-red-600 font-medium ml-1">
                                    (Expired)
                                  </span>
                                );
                              } else if (daysLeft <= 2) {
                                return (
                                  <span className="text-orange-600 font-medium ml-1">
                                    (Expires in {daysLeft} day
                                    {daysLeft > 1 ? "s" : ""})
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-gray-500 ml-1">
                                    ({daysLeft} days left)
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        member.role === "participant" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>

                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(member.status)}
                        {member.status}
                      </div>
                    </Badge>

                    <div className="flex items-center gap-1">
                      {!readOnly && member.status === "invited" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(member.id)}
                          disabled={resendingIds.has(member.id)}
                          title={
                            resendingIds.has(member.id)
                              ? "Sending..."
                              : "Resend invitation"
                          }
                          className="text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                        >
                          {resendingIds.has(member.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-1" />
                              <span className="text-xs">Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-1" />
                              <span className="text-xs">Resend</span>
                            </>
                          )}
                        </Button>
                      )}

                      {!readOnly ? (
                        <Select
                          value={member.role}
                          onValueChange={(value: "participant" | "observer") =>
                            updateMemberRole(member.id, value)
                          }
                        >
                          <SelectTrigger className="w-auto h-8 px-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="participant">
                              Participant
                            </SelectItem>
                            <SelectItem value="observer">Observer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            member.role === "participant"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {member.role}
                        </Badge>
                      )}

                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member.id)}
                          className="text-destructive hover:text-destructive"
                          title="Remove team member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              No team members added to this program yet.
            </p>
            <p className="text-sm">
              Add team members by email to include them in the coaching program.
            </p>
          </div>
        )}

        {/* Helper Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Email Notifications</p>
              <p>
                Team members will receive two emails: one when added to the
                program with details, and another when a coach is assigned with
                session schedules.
              </p>
            </div>
          </div>

          {teamMembers.filter((member) => member.status === "invited").length >
            0 && (
            <div className="flex items-start gap-2 pt-2 border-t border-muted-foreground/20">
              <Clock className="w-4 h-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium mb-1 text-blue-700">
                  Pending Invitations
                </p>
                <p>
                  Invitations expire after 7 days. You can resend individual
                  invitations or use "Resend All" for multiple pending
                  invitations. Team members will receive a fresh 7-day link when
                  you resend.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
