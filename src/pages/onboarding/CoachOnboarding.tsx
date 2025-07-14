import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Briefcase,
  Award,
  DollarSign,
  Calendar,
  FileText,
  Camera,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Logo from "@/components/ui/logo";

type OnboardingStep =
  | "profile"
  | "experience"
  | "expertise"
  | "pricing"
  | "availability"
  | "documents"
  | "review";

interface CoachProfile {
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  phone: string;
  bio: string;
  profileImage?: string;
}

interface Experience {
  yearsOfExperience: string;
  previousRoles: string[];
  industries: string[];
  certifications: string[];
  languages: string[];
}

interface Expertise {
  primaryAreas: string[];
  secondaryAreas: string[];
  specializations: string[];
  targetAudience: string[];
}

interface Pricing {
  hourlyRate: number;
  packageRates: {
    single: number;
    package5: number;
    package10: number;
  };
  currency: string;
}

interface Availability {
  timezone: string;
  weeklyHours: number;
  availability: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  preferredSessionLength: string;
}

interface Documents {
  resume?: File;
  certifications?: File[];
  portfolio?: File;
  agreementSigned: boolean;
}

export default function CoachOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Form data states
  const [profile, setProfile] = useState<CoachProfile>({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    title: "",
    company: "",
    location: "",
    phone: "",
    bio: "",
  });

  const [experience, setExperience] = useState<Experience>({
    yearsOfExperience: "",
    previousRoles: [],
    industries: [],
    certifications: [],
    languages: ["English"],
  });

  const [expertise, setExpertise] = useState<Expertise>({
    primaryAreas: [],
    secondaryAreas: [],
    specializations: [],
    targetAudience: [],
  });

  const [pricing, setPricing] = useState<Pricing>({
    hourlyRate: 150,
    packageRates: {
      single: 150,
      package5: 700,
      package10: 1300,
    },
    currency: "USD",
  });

  const [availability, setAvailability] = useState<Availability>({
    timezone: "UTC-8",
    weeklyHours: 20,
    availability: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "10:00", end: "16:00", available: false },
      sunday: { start: "10:00", end: "16:00", available: false },
    },
    preferredSessionLength: "60",
  });

  const [documents, setDocuments] = useState<Documents>({
    agreementSigned: false,
  });

  const steps = [
    { id: "profile", title: "Profile", icon: User },
    { id: "experience", title: "Experience", icon: Briefcase },
    { id: "expertise", title: "Expertise", icon: Award },
    { id: "pricing", title: "Pricing", icon: DollarSign },
    { id: "availability", title: "Availability", icon: Calendar },
    { id: "documents", title: "Documents", icon: FileText },
    { id: "review", title: "Review", icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const expertiseOptions = [
    "Leadership Development",
    "Executive Coaching",
    "Career Transition",
    "Strategic Planning",
    "Team Management",
    "Communication Skills",
    "Performance Management",
    "Conflict Resolution",
    "Change Management",
    "Sales Coaching",
    "Marketing Strategy",
    "Financial Management",
    "Startup Guidance",
    "Personal Branding",
    "Work-Life Balance",
  ];

  const industryOptions = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Retail",
    "Manufacturing",
    "Consulting",
    "Non-profit",
    "Government",
    "Real Estate",
    "Media",
    "Legal",
    "Hospitality",
    "Transportation",
    "Energy",
  ];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id as OnboardingStep);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Mock API call to save coach profile
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const coachData = {
        profile,
        experience,
        expertise,
        pricing,
        availability,
        documents,
      };

      console.log("Coach onboarding data:", coachData);

      toast.success("Welcome to our coaching platform!");
      navigate("/coach/dashboard");
    } catch (error) {
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpertise = (area: string, type: "primary" | "secondary") => {
    if (type === "primary") {
      setExpertise((prev) => ({
        ...prev,
        primaryAreas: prev.primaryAreas.includes(area)
          ? prev.primaryAreas.filter((a) => a !== area)
          : [...prev.primaryAreas, area],
      }));
    } else {
      setExpertise((prev) => ({
        ...prev,
        secondaryAreas: prev.secondaryAreas.includes(area)
          ? prev.secondaryAreas.filter((a) => a !== area)
          : [...prev.secondaryAreas, area],
      }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              <p className="text-gray-600">
                This information will be shown on your coach profile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Leadership Coach"
                value={profile.title}
                onChange={(e) =>
                  setProfile({ ...profile, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Current Company</Label>
                <Input
                  id="company"
                  placeholder="e.g., Executive Coaching Solutions"
                  value={profile.company}
                  onChange={(e) =>
                    setProfile({ ...profile, company: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={profile.location}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential clients about your background, experience, and coaching philosophy..."
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Your Experience</h2>
              <p className="text-gray-600">
                Help us understand your professional background
              </p>
            </div>

            <div>
              <Label htmlFor="yearsOfExperience">
                Years of Coaching Experience
              </Label>
              <Select
                value={experience.yearsOfExperience}
                onValueChange={(value) =>
                  setExperience({ ...experience, yearsOfExperience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 years</SelectItem>
                  <SelectItem value="2-5">2-5 years</SelectItem>
                  <SelectItem value="6-10">6-10 years</SelectItem>
                  <SelectItem value="11-15">11-15 years</SelectItem>
                  <SelectItem value="16+">16+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Industries You've Worked In</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {industryOptions.map((industry) => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={experience.industries.includes(industry)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExperience({
                            ...experience,
                            industries: [...experience.industries, industry],
                          });
                        } else {
                          setExperience({
                            ...experience,
                            industries: experience.industries.filter(
                              (i) => i !== industry,
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={industry} className="text-sm">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {experience.languages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                    <button
                      onClick={() =>
                        setExperience({
                          ...experience,
                          languages: experience.languages.filter(
                            (l) => l !== lang,
                          ),
                        })
                      }
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Add language"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const value = e.currentTarget.value.trim();
                      if (value && !experience.languages.includes(value)) {
                        setExperience({
                          ...experience,
                          languages: [...experience.languages, value],
                        });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        );

      case "expertise":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Your Expertise</h2>
              <p className="text-gray-600">
                Select your primary and secondary coaching areas
              </p>
            </div>

            <div>
              <Label>Primary Expertise Areas (Select 3-5)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {expertiseOptions.map((area) => (
                  <Badge
                    key={area}
                    variant={
                      expertise.primaryAreas.includes(area)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer p-2 text-center justify-center"
                    onClick={() => toggleExpertise(area, "primary")}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Secondary Areas (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {expertiseOptions
                  .filter((area) => !expertise.primaryAreas.includes(area))
                  .map((area) => (
                    <Badge
                      key={area}
                      variant={
                        expertise.secondaryAreas.includes(area)
                          ? "secondary"
                          : "outline"
                      }
                      className="cursor-pointer p-2 text-center justify-center"
                      onClick={() => toggleExpertise(area, "secondary")}
                    >
                      {area}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Set Your Rates</h2>
              <p className="text-gray-600">
                You can adjust these rates later based on demand
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Rate</CardTitle>
                  <CardDescription>Your standard session rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">$</span>
                    <Input
                      type="number"
                      value={pricing.hourlyRate}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          hourlyRate: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-2xl font-bold"
                    />
                    <span className="text-gray-500">/hour</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Package Rates</CardTitle>
                  <CardDescription>
                    Discounted rates for packages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>5-Session Package</Label>
                    <Input
                      type="number"
                      value={pricing.packageRates.package5}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          packageRates: {
                            ...pricing.packageRates,
                            package5: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>10-Session Package</Label>
                    <Input
                      type="number"
                      value={pricing.packageRates.package10}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          packageRates: {
                            ...pricing.packageRates,
                            package10: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "availability":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Your Availability</h2>
              <p className="text-gray-600">
                Set your general availability and preferred hours
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={availability.timezone}
                  onValueChange={(value) =>
                    setAvailability({ ...availability, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weeklyHours">Weekly Hours Available</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  value={availability.weeklyHours}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      weeklyHours: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Weekly Schedule</Label>
              <div className="space-y-2 mt-2">
                {Object.entries(availability.availability).map(
                  ([day, schedule]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-24 capitalize font-medium">{day}</div>
                      <Checkbox
                        checked={schedule.available}
                        onCheckedChange={(checked) =>
                          setAvailability({
                            ...availability,
                            availability: {
                              ...availability.availability,
                              [day]: { ...schedule, available: !!checked },
                            },
                          })
                        }
                      />
                      <Input
                        type="time"
                        value={schedule.start}
                        disabled={!schedule.available}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            availability: {
                              ...availability.availability,
                              [day]: { ...schedule, start: e.target.value },
                            },
                          })
                        }
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={schedule.end}
                        disabled={!schedule.available}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            availability: {
                              ...availability.availability,
                              [day]: { ...schedule, end: e.target.value },
                            },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Upload Documents</h2>
              <p className="text-gray-600">
                Help us verify your credentials and expertise
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Resume/CV
                  </CardTitle>
                  <CardDescription>
                    Upload your current resume or CV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input type="file" accept=".pdf,.doc,.docx" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications
                  </CardTitle>
                  <CardDescription>
                    Upload relevant coaching certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input type="file" accept=".pdf,.jpg,.png" multiple />
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreement"
                    checked={documents.agreementSigned}
                    onCheckedChange={(checked) =>
                      setDocuments({
                        ...documents,
                        agreementSigned: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="agreement">
                    I agree to the Coach Terms of Service and Privacy Policy
                  </Label>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Review Your Profile</h2>
              <p className="text-gray-600">
                Make sure everything looks good before submitting
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Name:</strong> {profile.firstName}{" "}
                    {profile.lastName}
                  </p>
                  <p>
                    <strong>Title:</strong> {profile.title}
                  </p>
                  <p>
                    <strong>Location:</strong> {profile.location}
                  </p>
                  <p>
                    <strong>Experience:</strong> {experience.yearsOfExperience}{" "}
                    years
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expertise & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Primary Areas:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {expertise.primaryAreas.map((area) => (
                        <Badge key={area} variant="default" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p>
                    <strong>Hourly Rate:</strong> ${pricing.hourlyRate}
                  </p>
                  <p>
                    <strong>Weekly Hours:</strong> {availability.weeklyHours}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your profile will be reviewed by our team within 24-48 hours.
                You'll receive an email confirmation once approved.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-xl font-bold text-primary">
                Coach Onboarding
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isCompleted
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isActive ? "text-blue-600 font-medium" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === "review" ? (
            <Button
              onClick={handleComplete}
              disabled={isLoading || !documents.agreementSigned}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
