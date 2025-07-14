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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, Shield, Calendar } from "lucide-react";
import { SubscriptionTier } from "@/types";

interface PaymentFormProps {
  selectedTier: SubscriptionTier;
  onSubmit: (data: PaymentFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export interface PaymentFormData {
  // Billing Information
  billingEmail: string;

  // Payment Method
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;

  // Billing Address
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;

  // Agreement
  agreeToTerms: boolean;
  subscribeToUpdates: boolean;
}

const months = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => String(currentYear + i));

export function PaymentForm({
  selectedTier,
  onSubmit,
  onBack,
  isLoading,
}: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    billingEmail: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "US",
    agreeToTerms: false,
    subscribeToUpdates: true,
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    // Required fields validation
    if (!formData.billingEmail.trim())
      newErrors.billingEmail = "Billing email is required";
    if (!formData.cardNumber.replace(/\s/g, "").trim())
      newErrors.cardNumber = "Card number is required";
    if (!formData.expiryMonth)
      newErrors.expiryMonth = "Expiry month is required";
    if (!formData.expiryYear) newErrors.expiryYear = "Expiry year is required";
    if (!formData.cvv.trim()) newErrors.cvv = "CVV is required";
    if (!formData.cardholderName.trim())
      newErrors.cardholderName = "Cardholder name is required";
    if (!formData.billingAddress.trim())
      newErrors.billingAddress = "Billing address is required";
    if (!formData.billingCity.trim())
      newErrors.billingCity = "City is required";
    if (!formData.billingState.trim())
      newErrors.billingState = "State is required";
    if (!formData.billingZip.trim())
      newErrors.billingZip = "ZIP code is required";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms and conditions";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.billingEmail && !emailRegex.test(formData.billingEmail)) {
      newErrors.billingEmail = "Please enter a valid email address";
    }

    // Card number validation (basic)
    const cardNumber = formData.cardNumber.replace(/\s/g, "");
    if (cardNumber && (cardNumber.length < 13 || cardNumber.length > 19)) {
      newErrors.cardNumber = "Please enter a valid card number";
    }

    // CVV validation
    if (formData.cvv && (formData.cvv.length < 3 || formData.cvv.length > 4)) {
      newErrors.cvv = "CVV must be 3 or 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updateFormData = (
    field: keyof PaymentFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "Visa";
    if (cleanNumber.startsWith("5") || cleanNumber.startsWith("2"))
      return "Mastercard";
    if (cleanNumber.startsWith("3")) return "American Express";
    return "";
  };

  const calculateTotal = () => {
    if (selectedTier.id === "enterprise") return "Custom pricing";
    return `$${selectedTier.price}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{selectedTier.name} Plan</div>
                <div className="text-sm text-muted-foreground">
                  Up to{" "}
                  {selectedTier.userCap === 999999
                    ? "unlimited"
                    : selectedTier.userCap}{" "}
                  team members
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{calculateTotal()}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedTier.id !== "enterprise" &&
                    `per ${selectedTier.billingPeriod}`}
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <div className="font-medium">14-day free trial</div>
                <Badge variant="secondary">Free</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                You won't be charged until your trial ends
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Enter your billing details for subscription management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingEmail">Billing Email *</Label>
            <Input
              id="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={(e) => updateFormData("billingEmail", e.target.value)}
              placeholder="billing@yourcompany.com"
              className={errors.billingEmail ? "border-destructive" : ""}
            />
            {errors.billingEmail && (
              <p className="text-sm text-destructive">{errors.billingEmail}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Your payment information is secure and encrypted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number *</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  updateFormData("cardNumber", formatted);
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={errors.cardNumber ? "border-destructive" : ""}
              />
              {getCardType(formData.cardNumber) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="text-xs">
                    {getCardType(formData.cardNumber)}
                  </Badge>
                </div>
              )}
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-destructive">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month *</Label>
              <Select
                value={formData.expiryMonth}
                onValueChange={(value) => updateFormData("expiryMonth", value)}
              >
                <SelectTrigger
                  className={errors.expiryMonth ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryMonth && (
                <p className="text-sm text-destructive">{errors.expiryMonth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year *</Label>
              <Select
                value={formData.expiryYear}
                onValueChange={(value) => updateFormData("expiryYear", value)}
              >
                <SelectTrigger
                  className={errors.expiryYear ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.expiryYear && (
                <p className="text-sm text-destructive">{errors.expiryYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                value={formData.cvv}
                onChange={(e) =>
                  updateFormData("cvv", e.target.value.replace(/\D/g, ""))
                }
                placeholder="123"
                maxLength={4}
                className={errors.cvv ? "border-destructive" : ""}
              />
              {errors.cvv && (
                <p className="text-sm text-destructive">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name *</Label>
            <Input
              id="cardholderName"
              value={formData.cardholderName}
              onChange={(e) => updateFormData("cardholderName", e.target.value)}
              placeholder="John Doe"
              className={errors.cardholderName ? "border-destructive" : ""}
            />
            {errors.cardholderName && (
              <p className="text-sm text-destructive">
                {errors.cardholderName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Street Address *</Label>
            <Input
              id="billingAddress"
              value={formData.billingAddress}
              onChange={(e) => updateFormData("billingAddress", e.target.value)}
              placeholder="123 Business Ave"
              className={errors.billingAddress ? "border-destructive" : ""}
            />
            {errors.billingAddress && (
              <p className="text-sm text-destructive">
                {errors.billingAddress}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingCity">City *</Label>
              <Input
                id="billingCity"
                value={formData.billingCity}
                onChange={(e) => updateFormData("billingCity", e.target.value)}
                placeholder="San Francisco"
                className={errors.billingCity ? "border-destructive" : ""}
              />
              {errors.billingCity && (
                <p className="text-sm text-destructive">{errors.billingCity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingState">State *</Label>
              <Input
                id="billingState"
                value={formData.billingState}
                onChange={(e) => updateFormData("billingState", e.target.value)}
                placeholder="CA"
                className={errors.billingState ? "border-destructive" : ""}
              />
              {errors.billingState && (
                <p className="text-sm text-destructive">
                  {errors.billingState}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingZip">ZIP Code *</Label>
              <Input
                id="billingZip"
                value={formData.billingZip}
                onChange={(e) => updateFormData("billingZip", e.target.value)}
                placeholder="94105"
                className={errors.billingZip ? "border-destructive" : ""}
              />
              {errors.billingZip && (
                <p className="text-sm text-destructive">{errors.billingZip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCountry">Country *</Label>
              <Select
                value={formData.billingCountry}
                onValueChange={(value) =>
                  updateFormData("billingCountry", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                updateFormData("agreeToTerms", checked as boolean)
              }
              className={errors.agreeToTerms ? "border-destructive" : ""}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="agreeToTerms"
                className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                *
              </Label>
              {errors.agreeToTerms && (
                <p className="text-sm text-destructive">
                  {errors.agreeToTerms}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="subscribeToUpdates"
              checked={formData.subscribeToUpdates}
              onCheckedChange={(checked) =>
                updateFormData("subscribeToUpdates", checked as boolean)
              }
            />
            <Label
              htmlFor="subscribeToUpdates"
              className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Send me product updates and newsletter
            </Label>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>
              Your payment information is secured with 256-bit SSL encryption
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between pt-6">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="ml-auto">
          <Lock className="w-4 h-4 mr-2" />
          {isLoading ? "Processing..." : "Start Free Trial"}
        </Button>
      </div>
    </form>
  );
}
