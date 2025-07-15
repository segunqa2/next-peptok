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
import Logo from "@/components/ui/logo";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Users,
  Building,
  UserCheck,
  Crown,
} from "lucide-react";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getDemoLoginCredentials } from "@/data/demoDatabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<
    "google" | "microsoft" | null
  >(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Debug function to test demo account
  const debugDemoAccount = async () => {
    console.log("🧪 Testing demo@platform.com login...");
    const testResult = await authService.testDemoLogin("demo@platform.com");
    toast.success("Check console for demo account debug info");
  };

  // Get demo credentials organized by user type
  const demoCredentials = getDemoLoginCredentials();
  const platformAdmins = demoCredentials.filter(
    (u) => u.userType === "platform_admin",
  );
  const companyAdmins = demoCredentials.filter(
    (u) => u.userType === "company_admin",
  );
  const coaches = demoCredentials.filter((u) => u.userType === "coach");
  const teamMembers = demoCredentials.filter(
    (u) => u.userType === "team_member",
  );

  // Quick demo login function
  const quickDemoLogin = async (email: string, password: string) => {
    setFormData({
      email,
      password,
      rememberMe: false,
    });

    // Small delay to let state update
    setTimeout(() => {
      document.querySelector("form")?.requestSubmit();
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      // Use the login function from auth context
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect based on user role or intended destination
        navigate("/dashboard");
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsOAuthLoading("google");
    try {
      // Simulate OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // For demo purposes, simulate successful OAuth login
      const result = await login("demo@google.com", "oauth_token");
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      setError("Google login failed. Please try again.");
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsOAuthLoading("microsoft");
    try {
      // Simulate OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // For demo purposes, simulate successful OAuth login
      const result = await login("demo@microsoft.com", "oauth_token");
      if (result.success) {
        navigate("/dashboard");
      }
    } catch (error) {
      setError("Microsoft login failed. Please try again.");
    } finally {
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>

        {/* Floating elements */}
        <div
          className="absolute top-1/3 right-1/4 w-4 h-4 bg-blue-500/20 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/4 left-1/3 w-6 h-6 bg-blue-400/15 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-blue-600/25 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent"></div>
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
                Welcome back
              </h1>
              <p className="text-muted-foreground text-lg">
                Sign in to your account to continue
              </p>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Sign in
              </CardTitle>
              <CardDescription className="text-base">
                Enter your email and password to access your account
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

              {/* Demo Credentials */}
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Demo Accounts (any password works):</strong>
                  <br />
                  <strong>
                    Platform Admin (manages entire platform):
                  </strong>{" "}
                  demo@platform.com
                  <br />
                  <strong>
                    Company Admin (manages company, creates sessions):
                  </strong>{" "}
                  demo@company.com
                  <br />
                  <strong>Coach (provides mentoring):</strong> demo@coach.com
                  <br />
                  <strong>Team Member (receives mentoring):</strong>{" "}
                  demo@team.com
                </AlertDescription>
              </Alert>

              {/* Debug Section - Only in development */}
              {import.meta.env.DEV && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-3">
                    Debug Tools:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={debugDemoAccount}
                    >
                      Debug Demo Account
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={quickDemoLogin}
                    >
                      Quick Demo Login
                    </Button>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 transition-colors"
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, rememberMe: !!checked })
                      }
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
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
                    onClick={handleGoogleLogin}
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
                    onClick={handleMicrosoftLogin}
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

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          {/* Demo Credentials Section */}
          <Card className="backdrop-blur-md bg-blue-50/80 border-blue-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-blue-800">
                <Users className="w-5 h-5 mr-2" />
                Demo Accounts ({demoCredentials.length} users)
              </CardTitle>
              <CardDescription className="text-blue-700">
                Use these sample accounts to explore different user roles and
                features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="platform" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/60">
                  <TabsTrigger value="platform" className="text-xs">
                    <Crown className="w-4 h-4 mr-1" />
                    Admins ({platformAdmins.length})
                  </TabsTrigger>
                  <TabsTrigger value="company" className="text-xs">
                    <Building className="w-4 h-4 mr-1" />
                    Companies ({companyAdmins.length})
                  </TabsTrigger>
                  <TabsTrigger value="coach" className="text-xs">
                    <UserCheck className="w-4 h-4 mr-1" />
                    Coaches ({coaches.length})
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs">
                    <Users className="w-4 h-4 mr-1" />
                    Team ({teamMembers.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="platform" className="space-y-3 mt-4">
                  <div className="text-sm text-blue-700 mb-3">
                    <Badge
                      variant="outline"
                      className="mr-2 border-blue-300 text-blue-700"
                    >
                      Platform Administrators
                    </Badge>
                    Full system access and user management
                  </div>
                  {platformAdmins.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/60 border border-blue-200/50 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-blue-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-600">{user.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          quickDemoLogin(user.email, user.password)
                        }
                        disabled={isLoading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Login
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="company" className="space-y-3 mt-4">
                  <div className="text-sm text-blue-700 mb-3">
                    <Badge
                      variant="outline"
                      className="mr-2 border-blue-300 text-blue-700"
                    >
                      Company Administrators
                    </Badge>
                    Manage company programs and employees
                  </div>
                  {companyAdmins.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/60 border border-blue-200/50 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-blue-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-600">{user.email}</p>
                        <p className="text-xs text-blue-500">{user.company}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          quickDemoLogin(user.email, user.password)
                        }
                        disabled={isLoading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Login
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="coach" className="space-y-3 mt-4">
                  <div className="text-sm text-blue-700 mb-3">
                    <Badge
                      variant="outline"
                      className="mr-2 border-blue-300 text-blue-700"
                    >
                      Professional Coaches
                    </Badge>
                    View matches, manage sessions, track earnings
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {coaches.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/60 border border-blue-200/50 rounded-lg hover:bg-white/80 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-blue-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-blue-600">{user.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            quickDemoLogin(user.email, user.password)
                          }
                          disabled={isLoading}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Login
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="team" className="space-y-3 mt-4">
                  <div className="text-sm text-blue-700 mb-3">
                    <Badge
                      variant="outline"
                      className="mr-2 border-blue-300 text-blue-700"
                    >
                      Team Members
                    </Badge>
                    Participate in coaching sessions and programs
                  </div>
                  {teamMembers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/60 border border-blue-200/50 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-blue-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-600">{user.email}</p>
                        <p className="text-xs text-blue-500">{user.company}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          quickDemoLogin(user.email, user.password)
                        }
                        disabled={isLoading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Login
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="mt-4 pt-3 border-t border-blue-200/50">
                <p className="text-xs text-blue-600 text-center">
                  All demo accounts use their listed passwords. Click "Login"
                  next to any account to sign in instantly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By signing in, you agree to our{" "}
              <Link
                to="/terms"
                className="text-primary hover:underline transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-primary hover:underline transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
