import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Logo from "@/components/ui/logo";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { authService } from "@/services/auth";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<
    "google" | "microsoft" | null
  >(null);
  const [error, setError] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUserEmail, setTempUserEmail] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
    role: "",
    userType: "enterprise" as "enterprise" | "coach",
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }
    if (!formData.company.trim()) errors.company = "Company is required";
    if (!formData.role) errors.role = "Please select your role";
    if (!formData.agreeToTerms)
      errors.terms = "You must agree to the terms and conditions";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please correct the errors below");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signupWithEmail({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        role: formData.role,
        userType: formData.userType,
      });

      if (response.success && response.user) {
        setTempUserEmail(formData.email);
        setShowTwoFactor(true);
      } else {
        setError(response.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorComplete = (secret: string, backupCodes: string[]) => {
    toast.success("Account created successfully with 2FA enabled!");

    // Determine onboarding path based on user type
    if (formData.userType === "coach") {
      navigate("/coach/onboarding");
    } else {
      navigate("/login");
    }
  };

  const handleTwoFactorSkip = () => {
    toast.success("Account created successfully!");

    // Determine onboarding path based on user type
    if (formData.userType === "coach") {
      navigate("/coach/onboarding");
    } else {
      navigate("/login");
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (error) setError("");
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleGoogleSignup = async () => {
    setIsOAuthLoading("google");
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      console.error("Google signup error:", error);
      toast.error("Failed to connect with Google. Please try again.");
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const handleMicrosoftSignup = async () => {
    setIsOAuthLoading("microsoft");
    try {
      await authService.loginWithMicrosoft();
    } catch (error) {
      console.error("Microsoft signup error:", error);
      toast.error("Failed to connect with Microsoft. Please try again.");
    } finally {
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-blue-600/10 animate-pulse"></div>

        {/* Geometric shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-blue-600/8 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400/6 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-700/7 rounded-full blur-3xl"></div>
        </div>

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Floating elements */}
        <div
          className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-500/20 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-6 h-6 bg-blue-400/15 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-600/25 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-50/30 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link to="/" className="inline-flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/20">
                  <Logo size="lg" />
                </div>
              </div>
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Create your account
              </h1>
              <p className="text-muted-foreground text-lg">
                Join thousands of professionals growing through coaching
              </p>
            </div>
          </div>

          {/* Show 2FA Setup or Signup Form */}
          {showTwoFactor ? (
            <TwoFactorSetup
              userEmail={tempUserEmail}
              onComplete={handleTwoFactorComplete}
              onSkip={handleTwoFactorSkip}
              isOptional={true}
            />
          ) : (
            /* Enhanced Signup Form */
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Sign up
                </CardTitle>
                <CardDescription className="text-base">
                  Create your account to get started with Peptok
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignup} className="space-y-6">
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      I want to join as:
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={
                          formData.userType === "company_admin"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleInputChange("userType", "company_admin")
                        }
                      >
                        👥 Company Admin
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.userType === "coach" ? "default" : "outline"
                        }
                        onClick={() => handleInputChange("userType", "coach")}
                        className="h-12 transition-all duration-200 hover:scale-105"
                        disabled={isLoading}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        Coach/Mentor
                      </Button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={`transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.firstName ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="text-xs text-red-500">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className={`transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.lastName ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="text-xs text-red-500">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className={`pl-10 transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.email ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-red-500">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium">
                      Company *
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) =>
                          handleInputChange("company", e.target.value)
                        }
                        className={`pl-10 transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.company ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {validationErrors.company && (
                      <p className="text-xs text-red-500">
                        {validationErrors.company}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Role *
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleInputChange("role", value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        className={`transition-all duration-200 hover:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.role ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-md">
                        {formData.userType === "company_admin" ? (
                          <>
                            <SelectItem value="ceo">
                              CEO
                            </SelectItem>
                            <SelectItem value="coo">
                              COO
                            </SelectItem>
                            <SelectItem value="cto">
                              CTO
                            </SelectItem>
                            <SelectItem value="product-manager">
                              Product Manager
                            </SelectItem>
                            <SelectItem value="data-analyst">
                              Data Analyst
                            </SelectItem>
                            <SelectItem value="marketing-manager">
                              Marketing Manager
                            </SelectItem>
                            <SelectItem value="sales-rep">
                              Sales Representative
                            </SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="hr-manager">
                              HR Manager
                            </SelectItem>
                            <SelectItem value="finance-manager">
                              Finance Manager
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="cto">Former CTO</SelectItem>
                            <SelectItem value="vp-engineering">
                              Former VP Engineering
                            </SelectItem>
                            <SelectItem value="cfo">Former CFO</SelectItem>
                            <SelectItem value="cmo">Former CMO</SelectItem>
                            <SelectItem value="head-product">
                              Former Head of Product
                            </SelectItem>
                            <SelectItem value="director">
                              Former Director
                            </SelectItem>
                            <SelectItem value="senior-manager">
                              Former Senior Manager
                            </SelectItem>
                            <SelectItem value="consultant">
                              Business Consultant
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.role && (
                      <p className="text-xs text-red-500">
                        {validationErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className={`pl-10 pr-10 transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm ${
                          validationErrors.password ? "border-red-500" : ""
                        }`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-red-500">
                        {validationErrors.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) =>
                        handleInputChange("agreeToTerms", checked as boolean)
                      }
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <div className="text-sm">
                      <label htmlFor="terms" className="text-muted-foreground">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>
                      </label>
                      {validationErrors.terms && (
                        <p className="text-xs text-red-500 mt-1">
                          {validationErrors.terms}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    size="lg"
                    disabled={isLoading || !formData.agreeToTerms}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <Separator className="my-4" />

                  {/* OAuth Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full transition-all duration-200 hover:scale-105 hover:shadow-md bg-white/70 backdrop-blur-sm"
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={isLoading || isOAuthLoading !== null}
                    >
                      {isOAuthLoading === "google" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      Continue with Google
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full transition-all duration-200 hover:scale-105 hover:shadow-md bg-white/70 backdrop-blur-sm"
                      type="button"
                      onClick={handleMicrosoftSignup}
                      disabled={isLoading || isOAuthLoading !== null}
                    >
                      {isOAuthLoading === "microsoft" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                        </svg>
                      )}
                      Continue with Microsoft
                    </Button>
                  </div>
                </div>

                {/* Sign In Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:underline font-medium transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demo Info */}
          {import.meta.env.DEV && (
            <Card className="backdrop-blur-md bg-green-50/80 border-green-200/50">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-green-800 mb-2">Demo Mode</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✅ Form validation is working</p>
                  <p>✅ OAuth buttons simulate real authentication</p>
                  <p>✅ All user types supported (Enterprise/Coach)</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
