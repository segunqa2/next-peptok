import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from "@/components/ui/logo";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { authService } from "@/services/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!email) {
        setError("Please enter your email address");
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      // Send password reset request
      const response = await authService.resetPassword(email);

      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-50 via-white to-blue-100">
          <div className="absolute inset-0 bg-gradient-to-l from-blue-400/10 via-transparent to-blue-600/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400/6 rounded-full blur-3xl"></div>
          </div>
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
            </div>

            {/* Success Card */}
            <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-2xl">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-800">
                      Check your email
                    </h2>
                    <p className="text-muted-foreground">
                      We've sent password reset instructions to{" "}
                      <strong>{email}</strong>
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email? Check your spam folder or try
                      again.
                    </p>

                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => {
                          setIsSuccess(false);
                          setEmail("");
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Try different email
                      </Button>

                      <Button asChild className="w-full">
                        <Link to="/login">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to sign in
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-blue-50 via-white to-blue-100">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-blue-400/10 via-transparent to-blue-600/10 animate-pulse"></div>

        {/* Geometric shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-20 left-20 w-60 h-60 bg-blue-600/8 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/6 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-700/7 rounded-full blur-3xl"></div>
        </div>

        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
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
                Reset password
              </h1>
              <p className="text-muted-foreground text-lg">
                Enter your email to receive reset instructions
              </p>
            </div>
          </div>

          {/* Reset Form */}
          <Card className="backdrop-blur-md bg-white/80 border-white/20 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Forgot password?
              </CardTitle>
              <CardDescription className="text-base">
                No worries, we'll send you reset instructions
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
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className="pl-10 transition-all duration-200 focus:scale-105 focus:shadow-md bg-white/70 backdrop-blur-sm"
                      disabled={isLoading}
                      required
                    />
                  </div>
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
                      Sending instructions...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link
                    to="/login"
                    className="flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
