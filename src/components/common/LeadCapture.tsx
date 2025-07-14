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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import LocalStorageService from "@/services/localStorageService";
import { ArrowRight, CheckCircle } from "lucide-react";

interface LeadData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  companySize: string;
  interests: string;
  message?: string;
  source: string;
  createdAt: string;
}

interface LeadCaptureProps {
  title?: string;
  description?: string;
  source?: string;
  compact?: boolean;
}

export function LeadCapture({
  title = "Get Started with Peptok",
  description = "Connect with expert coaches and transform your workforce development.",
  source = "landing_page",
  compact = false,
}: LeadCaptureProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    companySize: "",
    interests: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.company.trim()) {
      toast.error("Company name is required");
      return false;
    }
    if (!formData.jobTitle.trim()) {
      toast.error("Job title is required");
      return false;
    }
    if (!formData.companySize) {
      toast.error("Please select your company size");
      return false;
    }
    if (!formData.interests) {
      toast.error("Please select your primary interest");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const leadData: LeadData = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        source,
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage
      const existingLeads = JSON.parse(
        localStorage.getItem("peptok_leads") || "[]",
      );
      existingLeads.push(leadData);
      localStorage.setItem("peptok_leads", JSON.stringify(existingLeads));

      // Track in analytics
      const analyticsData = LocalStorageService.getAnalyticsData();
      const updatedAnalytics = {
        ...analyticsData,
        leads: {
          ...analyticsData.leads,
          total: (analyticsData.leads?.total || 0) + 1,
          bySource: {
            ...analyticsData.leads?.bySource,
            [source]: (analyticsData.leads?.bySource?.[source] || 0) + 1,
          },
          recent: [
            leadData,
            ...(analyticsData.leads?.recent || []).slice(0, 9),
          ],
        },
      };
      LocalStorageService.setAnalyticsData(updatedAnalytics);

      setIsSubmitted(true);
      toast.success("Thank you! We'll be in touch soon.");

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          jobTitle: "",
          companySize: "",
          interests: "",
          message: "",
        });
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-green-50/80 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Thank you for your interest!
              </h3>
              <p className="text-green-700">
                We've received your information and will be in touch within 24
                hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-blue-200/50 shadow-xl">
      <CardHeader className={compact ? "pb-4" : ""}>
        <CardTitle className={compact ? "text-lg" : "text-xl"}>
          {title}
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              placeholder="john.doe@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="Your Company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                placeholder="VP of People"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size *</Label>
            <Select
              value={formData.companySize}
              onValueChange={(value) =>
                handleSelectChange("companySize", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                <SelectItem value="1000+">1,000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Primary Interest *</Label>
            <Select
              value={formData.interests}
              onValueChange={(value) => handleSelectChange("interests", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="What interests you most?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leadership-coaching">
                  Leadership Coaching
                </SelectItem>
                <SelectItem value="technical-coaching">
                  Technical Skills Coaching
                </SelectItem>
                <SelectItem value="career-development">
                  Career Development
                </SelectItem>
                <SelectItem value="team-building">
                  Team Building & Management
                </SelectItem>
                <SelectItem value="executive-coaching">
                  Executive Coaching
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!compact && (
            <div className="space-y-2">
              <Label htmlFor="message">Additional Message</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Tell us more about your coaching needs..."
                rows={3}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 group"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to our Terms of Service and Privacy Policy.
            No spam, unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default LeadCapture;
