import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  ArrowLeft,
  Upload,
  Plus,
  X,
  Clock,
  DollarSign,
  User,
  Bell,
  Shield,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
import { analytics } from "@/services/analytics";
import { toast } from "sonner";

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  experience: number;
  hourlyRate: number;
  currency: string;
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      available: boolean;
    }>;
  };
  certifications: string[];
  languages: string[];
  profileImage: string;
  isActive: boolean;
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    newMatches: boolean;
    sessionReminders: boolean;
    paymentUpdates: boolean;
  };
  privacy: {
    showProfile: boolean;
    showRating: boolean;
    showExperience: boolean;
  };
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMEZONES = ["EST", "PST", "CST", "MST", "GMT", "CET", "JST", "AEST"];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "CAD", label: "CAD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

export default function CoachSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    if (!user || user.userType !== "coach") {
      navigate("/login");
      return;
    }

    loadProfile();

    // Track page view
    analytics.pageView({
      page: "coach_settings",
      userId: user.id,
      userType: user.userType,
    });
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profileData = await apiEnhanced.getCoachProfile(user.id);

      // Add default notification and privacy settings if not present
      const fullProfile: CoachProfile = {
        ...profileData,
        notifications: profileData.notifications || {
          emailNotifications: true,
          smsNotifications: false,
          newMatches: true,
          sessionReminders: true,
          paymentUpdates: true,
        },
        privacy: profileData.privacy || {
          showProfile: true,
          showRating: true,
          showExperience: true,
        },
      };

      setProfile(fullProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      await apiEnhanced.updateCoachProfile(user.id, profile);

      toast.success("Profile updated successfully");

      analytics.trackAction({
        action: "profile_updated",
        component: "coach_settings",
        metadata: { coachId: user.id },
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");

      analytics.trackError(
        error instanceof Error ? error : new Error("Profile save failed"),
        { component: "coach_settings", coachId: user.id },
      );
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (updates: Partial<CoachProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const updateAvailability = (dayIndex: number, field: string, value: any) => {
    if (!profile) return;

    const newSchedule = [...profile.availability.schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };

    updateProfile({
      availability: {
        ...profile.availability,
        schedule: newSchedule,
      },
    });
  };

  const addSkill = () => {
    if (!profile || !newSkill.trim()) return;

    if (!profile.skills.includes(newSkill.trim())) {
      updateProfile({
        skills: [...profile.skills, newSkill.trim()],
      });
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    updateProfile({
      skills: profile.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const addCertification = () => {
    if (!profile || !newCertification.trim()) return;

    if (!profile.certifications.includes(newCertification.trim())) {
      updateProfile({
        certifications: [...profile.certifications, newCertification.trim()],
      });
    }
    setNewCertification("");
  };

  const removeCertification = (certToRemove: string) => {
    if (!profile) return;
    updateProfile({
      certifications: profile.certifications.filter(
        (cert) => cert !== certToRemove,
      ),
    });
  };

  const addLanguage = () => {
    if (!profile || !newLanguage.trim()) return;

    if (!profile.languages.includes(newLanguage.trim())) {
      updateProfile({
        languages: [...profile.languages, newLanguage.trim()],
      });
    }
    setNewLanguage("");
  };

  const removeLanguage = (langToRemove: string) => {
    if (!profile) return;
    updateProfile({
      languages: profile.languages.filter((lang) => lang !== langToRemove),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">
                Loading settings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Failed to Load Settings
            </h2>
            <p className="text-muted-foreground mb-4">
              Unable to load your profile settings. Please try again.
            </p>
            <Button onClick={loadProfile}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/coach/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Coach Settings
              </h1>
              <p className="text-gray-600">
                Manage your profile, availability, and preferences
              </p>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update your basic profile information and professional details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-0 right-0"
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{profile.name}</h3>
                    <p className="text-sm text-gray-600">{profile.email}</p>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="isActive">Active Status</Label>
                      <Switch
                        id="isActive"
                        checked={profile.isActive}
                        onCheckedChange={(checked) =>
                          updateProfile({ isActive: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experience}
                      onChange={(e) =>
                        updateProfile({
                          experience: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Describe your coaching experience, expertise, and approach..."
                    value={profile.bio}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <Button onClick={addSkill} type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.certifications.map((cert, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {cert}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeCertification(cert)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a certification..."
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && addCertification()
                      }
                    />
                    <Button onClick={addCertification} type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.languages.map((lang, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {lang}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeLanguage(lang)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a language..."
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                    />
                    <Button onClick={addLanguage} type="button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>
                  Set your weekly schedule and timezone preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.availability.timezone}
                    onValueChange={(value) =>
                      updateProfile({
                        availability: {
                          ...profile.availability,
                          timezone: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Weekly Schedule</Label>
                  <div className="space-y-4 mt-3">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const schedule = profile.availability.schedule[index];
                      return (
                        <div
                          key={day}
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                        >
                          <div className="w-24">
                            <Label className="font-medium">{day}</Label>
                          </div>
                          <Switch
                            checked={schedule?.available || false}
                            onCheckedChange={(checked) =>
                              updateAvailability(index, "available", checked)
                            }
                          />
                          {schedule?.available && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Label>From:</Label>
                                <Input
                                  type="time"
                                  value={schedule.startTime || "09:00"}
                                  onChange={(e) =>
                                    updateAvailability(
                                      index,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-32"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label>To:</Label>
                                <Input
                                  type="time"
                                  value={schedule.endTime || "17:00"}
                                  onChange={(e) =>
                                    updateAvailability(
                                      index,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-32"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Rates</CardTitle>
                <CardDescription>
                  Set your coaching rates and currency preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={profile.hourlyRate}
                      onChange={(e) =>
                        updateProfile({
                          hourlyRate: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={profile.currency}
                      onValueChange={(value) =>
                        updateProfile({ currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Rate Preview</h4>
                  <p className="text-sm text-gray-600">
                    Your current rate:{" "}
                    <strong>
                      {profile.currency} ${profile.hourlyRate}/hour
                    </strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Platform commission (20%) will be deducted from your
                    earnings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          notifications: {
                            ...profile.notifications,
                            emailNotifications: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive urgent notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          notifications: {
                            ...profile.notifications,
                            smsNotifications: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Match Requests</Label>
                      <p className="text-sm text-gray-600">
                        Get notified when you receive new match requests
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications.newMatches}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          notifications: {
                            ...profile.notifications,
                            newMatches: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Reminders</Label>
                      <p className="text-sm text-gray-600">
                        Receive reminders before scheduled sessions
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications.sessionReminders}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          notifications: {
                            ...profile.notifications,
                            sessionReminders: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Updates</Label>
                      <p className="text-sm text-gray-600">
                        Get notified about payments and earnings
                      </p>
                    </div>
                    <Switch
                      checked={profile.notifications.paymentUpdates}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          notifications: {
                            ...profile.notifications,
                            paymentUpdates: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control what information is visible to potential clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Profile Publicly</Label>
                      <p className="text-sm text-gray-600">
                        Make your profile visible in coach directory
                      </p>
                    </div>
                    <Switch
                      checked={profile.privacy.showProfile}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          privacy: {
                            ...profile.privacy,
                            showProfile: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Rating</Label>
                      <p className="text-sm text-gray-600">
                        Display your average rating and reviews
                      </p>
                    </div>
                    <Switch
                      checked={profile.privacy.showRating}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          privacy: {
                            ...profile.privacy,
                            showRating: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Experience</Label>
                      <p className="text-sm text-gray-600">
                        Display your years of experience
                      </p>
                    </div>
                    <Switch
                      checked={profile.privacy.showExperience}
                      onCheckedChange={(checked) =>
                        updateProfile({
                          privacy: {
                            ...profile.privacy,
                            showExperience: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
