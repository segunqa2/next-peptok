import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CoachingRequestForm,
  CoachingRequestFormData,
} from "@/components/coaching/CoachingRequestForm";
import { SimpleTeamMemberCard } from "@/components/coaching/SimpleTeamMemberCard";

import Header from "@/components/layout/Header";
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  SubscriptionTier,
  CoachingRequest,
  SessionPricingTier,
  TeamMember,
} from "@/types";
import { toast } from "sonner";
import apiEnhanced from "@/services/apiEnhanced";
import { emailService } from "@/services/email";
import {
  matchingService,
  type MatchingRequest,
} from "@/services/matchingService";
import { useAuth } from "@/contexts/AuthContext";
import { BackendStatus } from "@/components/ui/BackendStatus";
import { duplicateCleanup } from "@/utils/duplicateCleanup";
import LocalStorageService from "@/services/localStorageService";
import {
  logProgramCreation,
  logProgramUpdate,
} from "@/services/interactionLogger";

export default function CreateCoachingRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionPricingTier, setSessionPricingTier] =
    useState<SessionPricingTier | null>(null);
  const [loadingTier, setLoadingTier] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load session pricing tier
  useEffect(() => {
    const loadSessionPricingTier = async () => {
      try {
        setLoadingTier(true);
        // Load session pricing tiers
        const tiers = await apiEnhanced.getSessionPricingTiers();
        // For demo purposes, use Premium plan as default
        const defaultTier = tiers.find((t) => t.id === "premium") || tiers[1];
        setSessionPricingTier(defaultTier);
      } catch (error) {
        console.error("Failed to load session pricing:", error);
        toast.error("Failed to load session pricing information");
      } finally {
        setLoadingTier(false);
      }
    };

    loadSessionPricingTier();
  }, []);
  const [savedDraft, setSavedDraft] = useState<CoachingRequestFormData | null>(
    null,
  );
  const [formData, setFormData] = useState<CoachingRequestFormData | null>(
    null,
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedDraft, setLastSavedDraft] = useState<string>("");
  const [existingRequests, setExistingRequests] = useState<CoachingRequest[]>(
    [],
  );
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSubmittingRef = useRef(false);

  // Load draft from localStorage and generate/load program ID
  useEffect(() => {
    // Generate a unique program ID for this session if not exists
    let storedProgramId = LocalStorageService.getProgramId();
    if (!storedProgramId) {
      storedProgramId = `program-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      LocalStorageService.setProgramId(storedProgramId);
    }
    setProgramId(storedProgramId);

    const draft = LocalStorageService.getCoachingRequestDraft();
    if (draft) {
      try {
        setSavedDraft(draft);
        // Load team members from draft if available
        if (draft.teamMembers && draft.teamMembers.length > 0) {
          setTeamMembers(draft.teamMembers);
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }

    // Load existing team members from localStorage
    const existingTeamMembers = LocalStorageService.getTeamMembers();
    if (existingTeamMembers.length > 0 && teamMembers.length === 0) {
      setTeamMembers(existingTeamMembers);
    }
  }, []);

  // Load existing requests to check for duplicates
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!user?.companyId) return;

      try {
        const requests = await apiEnhanced.getCoachingRequests({
          companyId: user.companyId,
        });
        setExistingRequests(requests);
        console.log(
          `📊 Loaded ${requests.length} existing requests for duplicate checking`,
        );
      } catch (error) {
        console.error("Failed to load existing requests:", error);
        // Check localStorage for existing requests
        try {
          const localRequests = LocalStorageService.getCoachingRequests();
          setExistingRequests(
            localRequests.filter(
              (req: any) => req.companyId === user.companyId,
            ),
          );
        } catch (localError) {
          console.error("Failed to load local requests:", localError);
        }
      }
    };

    loadExistingRequests();
  }, [user?.companyId]);

  // Check for duplicate requests
  const checkForDuplicates = (title: string): boolean => {
    const normalizedTitle = title.trim().toLowerCase();
    const duplicateFound = existingRequests.some(
      (req) => req.title?.trim().toLowerCase() === normalizedTitle,
    );

    if (duplicateFound) {
      const exactMatch = existingRequests.find(
        (req) => req.title?.trim().toLowerCase() === normalizedTitle,
      );
      console.log("🛑 Duplicate request found:", exactMatch);
      return true;
    }
    return false;
  };

  const handleSubmitRequest = async (data: CoachingRequestFormData) => {
    // Prevent double submission
    if (isSubmittingRef.current) {
      console.log(
        "🛑 Submission already in progress, ignoring duplicate request",
      );
      return;
    }

    // Check for duplicate requests
    if (checkForDuplicates(data.title)) {
      toast.error(
        `A program with the title "${data.title}" already exists. Please choose a different title.`,
      );
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Check if we have team members from either the separate state or form data
      const currentTeamMembers =
        teamMembers.length > 0 ? teamMembers : data.teamMembers;

      // Check if we have team members and warn if none are added
      const hasTeamMembers = currentTeamMembers.length > 0;

      if (!hasTeamMembers) {
        const shouldContinue = window.confirm(
          "⚠️ No team members have been added to this program.\n\n" +
            "You can add team members later, but the program will not be visible to participants until team members are assigned.\n\n" +
            "Do you want to continue creating the program without team members?",
        );

        if (!shouldContinue) {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // Note: With session-based pricing, team size validation is less restrictive
      // Pricing is calculated per session with additional participant fees
      const teamSize = currentTeamMembers.length;
      console.log(
        `Creating program for ${teamSize} team members with session-based pricing`,
      );
      // Create the request object
      const requestData = {
        companyId: user?.companyId || "default-company-id", // Use actual user company ID
        title: data.title,
        description: data.description,
        goals: data.goals,
        metricsToTrack: data.metricsToTrack,
        teamMembers: currentTeamMembers,
        preferredExpertise: data.preferredExpertise,
        budget: data.budget,
        timeline: data.timeline,
        status: "submitted" as const,
      };

      // Check if this is a demo user
      const isDemoUser = localStorage
        .getItem("peptok_token")
        ?.startsWith("demo_token_");
      let request;

      if (isDemoUser) {
        // Create demo request
        request = {
          id: `req_${Date.now()}`,
          ...requestData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update demo data with the new request
        const demoData = JSON.parse(
          localStorage.getItem("peptok_demo_data") || "{}",
        );
        if (demoData.dashboardStats) {
          demoData.dashboardStats.coachingRequests = [request];
          localStorage.setItem("peptok_demo_data", JSON.stringify(demoData));
        }

        console.log("🎭 Demo coaching request created:", request);
      } else {
        // Submit to API for real users
        request = await apiEnhanced.createCoachingRequest(requestData);
      }

      // Store in localStorage for persistence
      LocalStorageService.addCoachingRequest(request);

      // Log interaction for backend tracking (Issues #6 & #7)
      if (user?.id && request?.id) {
        try {
          await logProgramCreation(user.id, request.id, data);
          console.log("✅ Program creation interaction logged");
        } catch (logError) {
          console.warn("⚠️ Failed to log program creation:", logError);
          // Don't fail the request creation if logging fails
        }
      }

      // Send program details email to team members (if any)
      try {
        if (hasTeamMembers) {
          const programDetails = {
            programTitle: data.title,
            programDescription: data.description,
            startDate: data.timeline.startDate,
            endDate: data.timeline.endDate,
            sessionFrequency: data.timeline.sessionFrequency,
            companyName: user?.businessDetails?.companyName || "Your Company",
            adminName: user?.name || "Program Administrator",
            goals: data.goals.map((g) => g.title),
            metricsToTrack: data.metricsToTrack,
          };

          // Send email to each team member
          const emailPromises = currentTeamMembers.map((member) =>
            emailService.sendProgramDetails(member.email, programDetails),
          );

          await Promise.all(emailPromises);
          console.log(
            `📧 Program details sent to ${currentTeamMembers.length} team members`,
          );
        } else {
          console.log(
            "📧 No team members to notify - program created without initial team",
          );
        }
      } catch (emailError) {
        // Don't fail the whole process if emails fail
        console.error("Failed to send program details emails:", emailError);
      }

      // Run coach matching using platform admin algorithm settings
      try {
        toast.info("Finding matching coaches using algorithm settings...");

        const matchingRequest: MatchingRequest = {
          id: request.id || `req_${Date.now()}`,
          title: data.title,
          description: data.description,
          requiredSkills: data.expertise || [],
          preferredExperience: data.level || "mid-level",
          budget: data.budget || 150,
          timeline: {
            startDate: data.timeline.startDate,
            endDate: data.timeline.endDate,
          },
          teamMembers: hasTeamMembers
            ? currentTeamMembers.map((member) => member.email)
            : [],
          goals: data.goals.map((g) => g.title),
        };

        const matchingResults =
          await matchingService.findMatches(matchingRequest);

        toast.success(
          `Found ${matchingResults.matches.length} matching coaches! View them in the program details.`,
        );

        console.log("🎯 Coach matching completed:", {
          requestId: matchingRequest.id,
          totalMatches: matchingResults.matches.length,
          topMatch: matchingResults.matches[0]?.name,
          algorithmConfig: matchingResults.configUsed,
        });
      } catch (matchingError) {
        console.error("Coach matching failed:", matchingError);
        toast.warning(
          "Request created successfully, but coach matching failed. You can find coaches manually.",
        );
      }

      // Clear saved draft and program ID
      LocalStorageService.clearCoachingRequestDraft();
      setTeamMembers([]);
      setProgramId("");

      const successMessage = hasTeamMembers
        ? "Coaching request submitted successfully! Team members have been notified."
        : "Coaching request submitted successfully! You can add team members later.";

      toast.success(successMessage);

      // Navigate to appropriate dashboard based on user type
      const dashboardPath =
        user?.userType === "platform_admin" ? "/platform-admin" : "/dashboard";
      navigate(dashboardPath, {
        state: {
          newRequest: request,
          refresh: true,
          message:
            "Your coaching request has been submitted and is being reviewed.",
        },
      });
    } catch (error) {
      console.error("Failed to submit coaching request:", error);

      // More specific error message
      let errorMessage = "Failed to submit request. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Debounced draft save function to prevent multiple saves
  const debouncedSaveDraft = useCallback(
    (data: CoachingRequestFormData) => {
      // Clear existing timeout
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }

      // Set new timeout for 1 second delay
      draftSaveTimeoutRef.current = setTimeout(() => {
        handleSaveDraftImmediate(data);
      }, 1000);
    },
    [user?.companyId],
  );

  const handleSaveDraftImmediate = async (data: CoachingRequestFormData) => {
    // Skip if currently submitting final request
    if (isSubmittingRef.current) {
      console.log("🛑 Skipping draft save - final submission in progress");
      return;
    }

    // Check if draft content has changed to avoid duplicate saves
    const draftString = JSON.stringify(data);
    if (draftString === lastSavedDraft) {
      console.log("🛑 Draft unchanged, skipping save");
      return;
    }

    setIsDraftSaving(true);
    try {
      // Save to localStorage as backup
      LocalStorageService.setCoachingRequestDraft(data);
      setLastSavedDraft(draftString);

      console.log(
        "💾 Draft saved locally for program:",
        data.title || "Untitled",
      );

      // For drafts, only save locally to avoid creating duplicate requests
      // Backend will only be used for final submission
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSaveDraft = debouncedSaveDraft;

  const handleUpgradePrompt = () => {
    // With session-based pricing, direct users to pricing page for more information
    navigate("/pricing");
  };

  const loadDraft = () => {
    if (savedDraft) {
      // This would trigger a form reset with draft data
      // For now, we'll just show a success message
      toast.success("Draft loaded successfully!");
    }
  };

  const clearDraft = () => {
    LocalStorageService.clearCoachingRequestDraft();
    setSavedDraft(null);
    setTeamMembers([]);
    setProgramId("");
    toast.success("Draft cleared");
  };

  const handleFormDataChange = (data: CoachingRequestFormData) => {
    setFormData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                const dashboardPath =
                  user?.userType === "platform_admin"
                    ? "/platform-admin"
                    : "/dashboard";
                navigate(dashboardPath);
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                  Create New Coaching Program
                </h1>
                <BackendStatus />
              </div>
              <p className="text-muted-foreground">
                Create a comprehensive coaching program for your team. We'll
                help you find the right coaches and structure your program for
                maximum impact.
              </p>
            </div>

            {/* Session Pricing Info */}
            {!loadingTier && sessionPricingTier && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{sessionPricingTier.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ${sessionPricingTier.baseSessionPrice} per session
                      {sessionPricingTier.participantFee > 0 && (
                        <>
                          , +${sessionPricingTier.participantFee} per additional
                          participant
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pay-per-session pricing with{" "}
                    {sessionPricingTier.platformServiceCharge}% platform fee
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Draft Notice */}
            {savedDraft && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>You have a saved draft from a previous session.</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadDraft}>
                      Load Draft
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearDraft}>
                      Clear
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Main Form */}
            {loadingTier ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-4">
                      <Clock className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">
                        Loading session pricing information...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <CoachingRequestForm
                  onSubmit={handleSubmitRequest}
                  sessionPricingTier={sessionPricingTier}
                  onUpgradePrompt={handleUpgradePrompt}
                  initialData={savedDraft || undefined}
                  isLoading={isSubmitting}
                  onFormDataChange={handleFormDataChange}
                />

                {/* Optional Team Member Management Card */}
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Team Members are Optional:</strong> You can create a
                    coaching program without team members and add them later, or
                    add them now to notify them immediately about the program.
                  </AlertDescription>
                </Alert>

                <SimpleTeamMemberCard
                  teamMembers={teamMembers}
                  onUpdateTeamMembers={(updatedTeamMembers) => {
                    setTeamMembers(updatedTeamMembers);
                    // Debounced auto-save team members to draft
                    const currentDraft = formData || {
                      title: "",
                      description: "",
                      goals: [],
                      metricsToTrack: [],
                      teamMembers: [],
                      preferredExpertise: [],
                      timeline: {
                        startDate: "",
                        endDate: "",
                        sessionFrequency: "bi-weekly",
                      },
                    };
                    const updatedDraft = {
                      ...currentDraft,
                      teamMembers: updatedTeamMembers,
                    };
                    // Use debounced save to prevent multiple saves
                    handleSaveDraft(updatedDraft);
                  }}
                  programTitle={formData?.title || "New Coaching Program"}
                  programId={programId}
                />

                {/* Form Actions at Bottom */}
                <div className="flex justify-between items-center pt-8 border-t bg-white sticky bottom-0 pb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const draftToSave = formData || {
                        title: "",
                        description: "",
                        goals: [],
                        metricsToTrack: [],
                        teamMembers: teamMembers,
                        preferredExpertise: [],
                        timeline: {
                          startDate: "",
                          endDate: "",
                          sessionFrequency: "bi-weekly",
                        },
                      };
                      // Use immediate save for manual draft save
                      handleSaveDraftImmediate(draftToSave);
                    }}
                    disabled={isSubmitting || isDraftSaving}
                  >
                    {isDraftSaving ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (formData) {
                        handleSubmitRequest({
                          ...formData,
                          teamMembers:
                            teamMembers.length > 0
                              ? teamMembers
                              : formData.teamMembers,
                        });
                      } else {
                        toast.error("Please fill in the program details first");
                      }
                    }}
                    disabled={isSubmitting || !formData || isDraftSaving}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
