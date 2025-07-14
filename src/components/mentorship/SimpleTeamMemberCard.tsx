import React, { useState } from "react";
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
import LocalStorageService from "@/services/localStorageService";

interface SimpleTeamMemberCardProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (teamMembers: TeamMember[]) => void;
  programTitle?: string;
  programId?: string;
  className?: string;
  readOnly?: boolean;
}

export function SimpleTeamMemberCard({
  teamMembers,
  onUpdateTeamMembers,
  programTitle = "Coaching Program",
  programId,
  className,
  readOnly = false,
}: SimpleTeamMemberCardProps) {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "participant" | "observer"
  >("participant");
  const [isAdding, setIsAdding] = useState(false);

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

    setIsAdding(true);

    try {
      // Create new team member entry
      const newTeamMember: TeamMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: newMemberEmail.toLowerCase(),
        name: newMemberName.trim() || undefined,
        role: newMemberRole,
        status: "invited",
        invitedAt: new Date().toISOString(),
      };

      // Add to team members list
      const updatedTeamMembers = [...teamMembers, newTeamMember];
      onUpdateTeamMembers(updatedTeamMembers);

      // Save to localStorage for persistence
      try {
        LocalStorageService.setTeamMembers(updatedTeamMembers);
        console.log(
          "✅ Team members saved to localStorage:",
          updatedTeamMembers.length,
        );
      } catch (error) {
        console.warn("Failed to save team members to localStorage:", error);
      }

      // Reset form
      setNewMemberEmail("");
      setNewMemberName("");
      setNewMemberRole("participant");

      // Success message
      toast.success(`✅ Team member added: ${newMemberEmail}`, {
        description: `${newMemberEmail} has been added to "${programTitle}". In production, they would receive an invitation email.`,
        duration: 5000,
      });

      console.log("👥 Team Member Added Successfully:", {
        email: newTeamMember.email,
        name: newTeamMember.name,
        role: newTeamMember.role,
        programId: programId,
        status: "invited",
      });
    } catch (error) {
      console.error("Failed to add team member:", error);
      toast.error("Failed to add team member. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const removeTeamMember = (memberId: string) => {
    const member = teamMembers.find((member) => member.id === memberId);
    if (member) {
      const updatedTeamMembers = teamMembers.filter(
        (member) => member.id !== memberId,
      );
      onUpdateTeamMembers(updatedTeamMembers);
      try {
        LocalStorageService.setTeamMembers(updatedTeamMembers);
        console.log("✅ Team member removed and saved to localStorage");
      } catch (error) {
        console.warn("Failed to save team members to localStorage:", error);
      }
      toast.success(`Removed ${member.email} from the program`);
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
    try {
      LocalStorageService.setTeamMembers(updatedMembers);
      console.log("✅ Team member role updated and saved to localStorage");
    } catch (error) {
      console.warn("Failed to save team members to localStorage:", error);
    }
    toast.success("Team member role updated successfully");
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
          will be notified about the program.
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
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberName">Full Name (Optional)</Label>
                <Input
                  id="memberName"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="memberRole">Role in Program</Label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value: "participant" | "observer") =>
                    setNewMemberRole(value)
                  }
                  disabled={isAdding}
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
                disabled={isAdding || !newMemberEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAdding ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Adding Team Member...
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
                        <div className="text-xs text-muted-foreground">
                          Invited{" "}
                          {new Date(member.invitedAt).toLocaleDateString()}
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
                      {!readOnly && (
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
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Team Member Management</p>
              <p>
                Team members are automatically saved to the program. In
                production, they would receive email invitations to join the
                coaching sessions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SimpleTeamMemberCard;
