import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, User, Mail, Phone, MapPin } from "lucide-react";

interface CompanyDetailsFormProps {
  onSubmit: (data: CompanyFormData) => void;
  onBack?: () => void;
  initialData?: Partial<CompanyFormData>;
  isLoading?: boolean;
}

export interface CompanyFormData {
  // Company Information
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;

  // Admin User Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;

  // Address Information
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Consulting",
  "Real Estate",
  "Media & Entertainment",
  "Transportation",
  "Energy",
  "Other",
];

const companySizes = [
  { value: "startup", label: "Startup (1-10 employees)" },
  { value: "small", label: "Small (11-50 employees)" },
  { value: "medium", label: "Medium (51-200 employees)" },
  { value: "large", label: "Large (201-1000 employees)" },
  { value: "enterprise", label: "Enterprise (1000+ employees)" },
];

export function CompanyDetailsForm({
  onSubmit,
  onBack,
  initialData,
  isLoading,
}: CompanyDetailsFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: initialData?.companyName || "",
    industry: initialData?.industry || "",
    companySize: initialData?.companySize || "",
    website: initialData?.website || "",
    description: initialData?.description || "",
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    title: initialData?.title || "",
    street: initialData?.street || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zipCode: initialData?.zipCode || "",
    country: initialData?.country || "United States",
  });

  const [errors, setErrors] = useState<Partial<CompanyFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CompanyFormData> = {};

    // Required fields validation
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.industry) newErrors.industry = "Industry is required";
    if (!formData.companySize)
      newErrors.companySize = "Company size is required";
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.title.trim()) newErrors.title = "Job title is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Website validation (if provided)
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website =
        "Please enter a valid website URL (include http:// or https://)";
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

  const updateFormData = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Tell us about your company and its needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                placeholder="Enter your company name"
                className={errors.companyName ? "border-destructive" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => updateFormData("industry", value)}
              >
                <SelectTrigger
                  className={errors.industry ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size *</Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) => updateFormData("companySize", value)}
              >
                <SelectTrigger
                  className={errors.companySize ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companySize && (
                <p className="text-sm text-destructive">{errors.companySize}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateFormData("website", e.target.value)}
                placeholder="https://yourcompany.com"
                className={errors.website ? "border-destructive" : ""}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Brief description of your company and what you do..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Admin User Information
          </CardTitle>
          <CardDescription>
            Information for the primary admin user who will manage the account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                placeholder="Enter first name"
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                placeholder="Enter last name"
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="admin@yourcompany.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., CEO, HR Director, Learning & Development Manager"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Company Address
          </CardTitle>
          <CardDescription>
            Optional: Provide your company's primary address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => updateFormData("street", e.target.value)}
              placeholder="123 Business Ave"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="San Francisco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                placeholder="CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => updateFormData("zipCode", e.target.value)}
                placeholder="94105"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                placeholder="United States"
              />
            </div>
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
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
