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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  QrCode,
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
// Temporarily commented out due to container build issue
// import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  userEmail: string;
  onComplete: (secret: string, backupCodes: string[]) => void;
  onSkip?: () => void;
  isOptional?: boolean;
}

export function TwoFactorSetup({
  userEmail,
  onComplete,
  onSkip,
  isOptional = true,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  // Mock secret generation (in real app, this would come from backend)
  const secret = "JBSWY3DPEHPK3PXP";
  const qrCodeData = `otpauth://totp/YourApp:${userEmail}?secret=${secret}&issuer=YourApp`;

  const backupCodes = [
    "123456789",
    "987654321",
    "456789123",
    "789123456",
    "321654987",
    "654987321",
    "147258369",
    "963852741",
  ];

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret key copied to clipboard");
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    toast.success("Backup codes copied to clipboard");
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      // Mock verification (in real app, verify with backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo, accept any 6-digit code
      if (verificationCode.length === 6) {
        setStep("backup");
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = () => {
    onComplete(secret, backupCodes);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  if (step === "setup") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app:
            </p>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                {/* Temporarily replaced with placeholder */}
                <div className="w-40 h-40 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                  QR Code Placeholder
                  <br />
                  Manual setup available
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">
              Recommended authenticator apps:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="justify-center p-2">
                <Smartphone className="w-4 h-4 mr-1" />
                Google Authenticator
              </Badge>
              <Badge variant="outline" className="justify-center p-2">
                <Smartphone className="w-4 h-4 mr-1" />
                Microsoft Authenticator
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Or enter this secret key manually:</Label>
            <div className="flex items-center gap-2">
              <Input value={secret} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySecret}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setStep("verify")}
              className="w-full"
              size="lg"
            >
              <QrCode className="w-4 h-4 mr-2" />
              I've Added the Account
            </Button>

            {isOptional && (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full"
                size="lg"
              >
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Verify Your Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              placeholder="123456"
              className="text-center text-lg font-mono tracking-wider"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setStep("setup")}
              className="w-full"
            >
              Back to Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "backup") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Download className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle>Save Your Backup Codes</CardTitle>
          <CardDescription>
            Keep these codes safe - you'll need them if you lose access to your
            authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Save these backup codes in a secure
              location. Each code can only be used once.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Backup Codes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBackupCodes}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-sm text-center p-2 bg-white rounded border"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleComplete} className="w-full" size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
