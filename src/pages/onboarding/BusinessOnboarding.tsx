import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import {
  CompanyDetailsForm,
  CompanyFormData,
} from "@/components/onboarding/CompanyDetailsForm";
import { SubscriptionTiers } from "@/components/onboarding/SubscriptionTiers";
import {
  PaymentForm,
  PaymentFormData,
} from "@/components/onboarding/PaymentForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionTier, CompanyProfile } from "@/types";
import { toast } from "sonner";
import { authService } from "@/services/auth";

type OnboardingStep =
  | "company-details"
  | "subscription"
  | "payment"
  | "welcome";

const steps = [
  {
    id: "company-details",
    title: "Company Details",
    description: "Basic information",
    completed: false,
  },
  {
    id: "subscription",
    title: "Choose Plan",
    description: "Select features",
    completed: false,
  },
  {
    id: "payment",
    title: "Payment",
    description: "Billing setup",
    completed: false,
  },
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("company-details");
  const [isLoading, setIsLoading] = useState(false);

  // Form data state
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load saved business details on component mount
  useEffect(() => {
    const savedBusinessDetails = authService.getSavedBusinessDetails();
    if (savedBusinessDetails) {
      // Pre-populate company data from signup
      const preFilledData: CompanyFormData = {
        companyName: savedBusinessDetails.companyName,
        email: authService.getCurrentUser()?.email || "",
        industry: savedBusinessDetails.industry,
        employeeCount: savedBusinessDetails.employeeCount,
        website: savedBusinessDetails.website || "",
        phone: savedBusinessDetails.phone || "",
        address: {
          street: "",
          city: "",
          state: "",
          country: "",
          zipCode: "",
        },
      };
      setCompanyData(preFilledData);
    }
  }, []);

  const handleCompanyDetailsSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call for validation and email sending
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Save data and mark step as completed
      setCompanyData(data);
      setCompletedSteps((prev) => new Set([...prev, "company-details"]));

      // Send welcome email simulation
      toast.success("Welcome email sent to " + data.email);

      // Move to next step
      setCurrentStep("subscription");
    } catch (error) {
      toast.error("Failed to save company details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTierSelection = async (tier: SubscriptionTier) => {
    setIsLoading(true);

    try {
      // Simulate tier validation
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSelectedTier(tier);
      setCompletedSteps((prev) => new Set([...prev, "subscription"]));

      if (tier.id === "enterprise") {
        // For enterprise, redirect to admin dashboard for full control
        toast.success(
          "Enterprise plan selected. Our sales team will contact you shortly.",
        );
        navigate("/admin", { state: { companyData, selectedTier: tier } });
        return;
      }

      // Move to payment step
      setCurrentStep("payment");
    } catch (error) {
      toast.error("Failed to select subscription tier. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPaymentData(data);
      setCompletedSteps((prev) => new Set([...prev, "payment"]));

      // Process payment and activate subscription
      const companyProfile: CompanyProfile = {
        id: "company-" + Date.now(),
        name: companyData!.companyName,
        industry: companyData!.industry,
        size: companyData!.companySize as any,
        website: companyData!.website,
        description: companyData!.description,
        adminUser: {
          firstName: companyData!.firstName,
          lastName: companyData!.lastName,
          email: companyData!.email,
          phone: companyData!.phone,
          title: companyData!.title,
        },
        address: {
          street: companyData!.street,
          city: companyData!.city,
          state: companyData!.state,
          zipCode: companyData!.zipCode,
          country: companyData!.country,
        },
        subscription: {
          tierId: selectedTier!.id,
          status: "trial",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          teamSize: 0,
        },
      };

      toast.success("Payment processed successfully! Welcome to Peptok!");

      // Move to welcome step
      setCurrentStep("welcome");
    } catch (error) {
      toast.error(
        "Payment processing failed. Please check your details and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    // Navigate to appropriate dashboard based on user type
    // For business onboarding, this is typically admin dashboard
    // but could be enterprise dashboard for smaller companies
    const targetDashboard =
      selectedTier?.id === "starter" || selectedTier?.id === "professional"
        ? "/dashboard"
        : "/admin";

    navigate(targetDashboard, {
      state: {
        companyData,
        selectedTier,
        isNewAccount: true,
      },
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "company-details":
        return (
          <CompanyDetailsForm
            onSubmit={handleCompanyDetailsSubmit}
            initialData={companyData || undefined}
            isLoading={isLoading}
          />
        );

      case "subscription":
        return (
          <SubscriptionTiers
            onSelectTier={handleTierSelection}
            onBack={() => setCurrentStep("company-details")}
            selectedTier={selectedTier?.id}
            isLoading={isLoading}
          />
        );

      case "payment":
        return (
          <PaymentForm
            selectedTier={selectedTier!}
            onSubmit={handlePaymentSubmit}
            onBack={() => setCurrentStep("subscription")}
            isLoading={isLoading}
          />
        );

      case "welcome":
        return (
          <WelcomeStep
            companyName={companyData?.companyName || ""}
            tierName={selectedTier?.name || ""}
            onGetStarted={handleGetStarted}
          />
        );

      default:
        return null;
    }
  };

  // Update steps with completion status
  const stepsWithCompletion = steps.map((step) => ({
    ...step,
    completed: completedSteps.has(step.id),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/peptok-logo.png" alt="Peptok" className="h-8 w-auto" />
              <span className="text-xl font-bold text-primary">
                Business Onboarding
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Questions? Contact our sales team
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          {currentStep !== "welcome" && (
            <div className="mb-8">
              <ProgressStepper
                steps={stepsWithCompletion}
                currentStep={currentStep}
              />
            </div>
          )}

          {/* Current Step Content */}
          <div className="space-y-6">{renderCurrentStep()}</div>
        </div>
      </div>
    </div>
  );
}

interface WelcomeStepProps {
  companyName: string;
  tierName: string;
  onGetStarted: () => void;
}

function WelcomeStep({
  companyName,
  tierName,
  onGetStarted,
}: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-primary">
          Welcome to Peptok, {companyName}!
        </h1>

        <p className="text-lg text-muted-foreground">
          Your {tierName} account has been successfully created and your 14-day
          free trial has started.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Sparkles className="w-5 h-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold">
                ✨ Set Up Your First Mentorship Request
              </h3>
              <p className="text-sm text-muted-foreground">
                Create your first mentorship program and invite team members
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">👥 Invite Your Team</h3>
              <p className="text-sm text-muted-foreground">
                Add team members and start building mentorship relationships
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">📊 Explore Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Monitor progress and track success metrics
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🎯 Define Goals</h3>
              <p className="text-sm text-muted-foreground">
                Set measurable objectives for your mentorship programs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button onClick={onGetStarted} size="lg" className="w-full md:w-auto">
          Get Started with Peptok
        </Button>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            <span>Setup guide sent to your email</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
        <strong>Important:</strong> Your free trial gives you full access to all{" "}
        {tierName} features. You'll only be charged after 14 days, and you can
        cancel anytime.
      </div>
    </div>
  );
}
