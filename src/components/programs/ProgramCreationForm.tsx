import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Users,
  Calendar,
  Target,
  DollarSign,
  Clock,
  Video,
  MessageSquare,
  Phone,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { programService } from "@/services/programService";
import { CreateProgramRequest } from "@/types/program";
// Updated to use production API services

const programSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  focusAreas: z.array(z.string()).min(1, "At least one focus area is required"),
  level: z.enum(["beginner", "intermediate", "advanced", "mixed"]),
  timeline: z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    sessionFrequency: z.enum(["weekly", "bi-weekly", "monthly", "custom"]),
    hoursPerSession: z.number().min(0.5).max(8),
    totalSessions: z.number().min(1).max(100),
    sessionType: z.enum(["video", "audio", "chat", "in-person"]),
  }),
  participants: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        role: z.string().min(1, "Role is required"),
        department: z.string().optional(),
      }),
    )
    .min(1, "At least one participant is required"),
  goals: z
    .array(
      z.object({
        title: z.string().min(1, "Goal title is required"),
        description: z.string().min(1, "Goal description is required"),
        priority: z.enum(["high", "medium", "low"]),
      }),
    )
    .min(1, "At least one goal is required"),
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default("USD"),
    totalBudget: z.number().optional(),
    budgetPerSession: z.number().optional(),
  }),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface ProgramCreationFormProps {
  onSuccess?: (programId: string) => void;
  onCancel?: () => void;
}

export const ProgramCreationForm: React.FC<ProgramCreationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillSuggestions] = useState([
    "Leadership",
    "Communication",
    "Project Management",
    "Technical Skills",
    "Sales",
    "Marketing",
    "Data Analysis",
    "Strategic Planning",
    "Team Building",
    "Negotiation",
  ]);
  const [focusAreaSuggestions] = useState([
    "Career Development",
    "Performance Improvement",
    "Skill Building",
    "Leadership Development",
    "Team Effectiveness",
    "Innovation",
    "Process Optimization",
    "Customer Relations",
    "Digital Transformation",
    "Change Management",
  ]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: "",
      description: "",
      skills: [],
      focusAreas: [],
      level: "intermediate",
      timeline: {
        sessionFrequency: "weekly",
        hoursPerSession: 1,
        totalSessions: 8,
        sessionType: "video",
      },
      participants: [{ name: "", email: "", role: "", department: "" }],
      goals: [{ title: "", description: "", priority: "medium" }],
      budget: {
        min: 1000,
        max: 5000,
        currency: "USD",
      },
    },
  });

  const {
    fields: participantFields,
    append: appendParticipant,
    remove: removeParticipant,
  } = useFieldArray({
    control,
    name: "participants",
  });

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({
    control,
    name: "goals",
  });

  const watchedTimeline = watch("timeline");
  const watchedBudget = watch("budget");

  // Calculate estimated total cost
  const estimatedCost = React.useMemo(() => {
    const avgCost = (watchedBudget.min + watchedBudget.max) / 2;
    const totalHours =
      watchedTimeline.totalSessions * watchedTimeline.hoursPerSession;
    return totalHours * (avgCost / watchedTimeline.totalSessions);
  }, [watchedTimeline, watchedBudget]);

  const onSubmit = async (data: ProgramFormData) => {
    if (!user?.companyId) {
      toast.error("Company information not found");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, clear any dummy data
      programService.clearDummyData();

      const programRequest: CreateProgramRequest = {
        ...data,
        companyId: user.companyId,
        companyName: user.companyName || "Your Company",
        createdBy: user.id,
        lastModifiedBy: user.id,
        // Generate IDs for nested objects
        participants: data.participants.map((p) => ({
          ...p,
          id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })),
        goals: data.goals.map((g) => ({
          ...g,
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
        })),
      };

      const createdProgram = await programService.createProgram(programRequest);

      toast.success(
        "Program created successfully! Looking for suitable coaches...",
      );

      if (onSuccess) {
        onSuccess(createdProgram.id);
      } else {
        navigate(`/programs/${createdProgram.id}`);
      }
    } catch (error) {
      console.error("Failed to create program:", error);
      toast.error("Failed to create program");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = (skill: string) => {
    const currentSkills = watch("skills") || [];
    if (!currentSkills.includes(skill)) {
      setValue("skills", [...currentSkills, skill]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = watch("skills") || [];
    setValue(
      "skills",
      currentSkills.filter((skill) => skill !== skillToRemove),
    );
  };

  const addFocusArea = (area: string) => {
    const currentAreas = watch("focusAreas") || [];
    if (!currentAreas.includes(area)) {
      setValue("focusAreas", [...currentAreas, area]);
    }
  };

  const removeFocusArea = (areaToRemove: string) => {
    const currentAreas = watch("focusAreas") || [];
    setValue(
      "focusAreas",
      currentAreas.filter((area) => area !== areaToRemove),
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Create New Coaching Program
        </CardTitle>
        <CardDescription>
          Design a comprehensive coaching program for your team members.
          Sessions will be automatically scheduled based on your timeline.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="goals">Goals & Budget</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Program Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Leadership Development Program"
                    {...register("title")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Program Level *</Label>
                  <Select
                    onValueChange={(value) => setValue("level", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="mixed">Mixed Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Program Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the program objectives, target audience, and expected outcomes..."
                  rows={4}
                  {...register("description")}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label>Required Skills *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {watch("skills")?.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addSkill(skill)}
                    >
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div className="space-y-3">
                <Label>Focus Areas *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {watch("focusAreas")?.map((area, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {area}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeFocusArea(area)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {focusAreaSuggestions.map((area) => (
                    <Badge
                      key={area}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addFocusArea(area)}
                    >
                      + {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("timeline.startDate")}
                    className={
                      errors.timeline?.startDate ? "border-red-500" : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("timeline.endDate")}
                    className={errors.timeline?.endDate ? "border-red-500" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Session Frequency *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("timeline.sessionFrequency", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursPerSession">Hours per Session *</Label>
                  <Input
                    id="hoursPerSession"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    {...register("timeline.hoursPerSession", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSessions">Total Sessions *</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    min="1"
                    max="100"
                    {...register("timeline.totalSessions", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Session Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "video", label: "Video Call", icon: Video },
                    { value: "audio", label: "Audio Call", icon: Phone },
                    { value: "chat", label: "Text Chat", icon: MessageSquare },
                    { value: "in-person", label: "In Person", icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={
                        watch("timeline.sessionType") === value
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setValue("timeline.sessionType", value as any)
                      }
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timeline Summary */}
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Program Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Total Sessions:
                      </span>{" "}
                      {watchedTimeline.totalSessions}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Hours:
                      </span>{" "}
                      {watchedTimeline.totalSessions *
                        watchedTimeline.hoursPerSession}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      {watchedTimeline.totalSessions}{" "}
                      {watchedTimeline.sessionFrequency === "weekly"
                        ? "weeks"
                        : watchedTimeline.sessionFrequency === "bi-weekly"
                          ? "bi-weeks"
                          : "months"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>{" "}
                      {watchedTimeline.sessionType}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Program Participants *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendParticipant({
                      name: "",
                      email: "",
                      role: "",
                      department: "",
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>
              </div>

              <div className="space-y-4">
                {participantFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Participant {index + 1}
                      </h4>
                      {participantFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeParticipant(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          placeholder="Full name"
                          {...register(`participants.${index}.name`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="email@company.com"
                          {...register(`participants.${index}.email`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Input
                          placeholder="Job title or role"
                          {...register(`participants.${index}.role`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                          placeholder="Department (optional)"
                          {...register(`participants.${index}.department`)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Goals & Budget Tab */}
            <TabsContent value="goals" className="space-y-6">
              {/* Goals Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Program Goals *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendGoal({
                        title: "",
                        description: "",
                        priority: "medium",
                      })
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </Button>
                </div>

                <div className="space-y-4">
                  {goalFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Goal {index + 1}
                        </h4>
                        {goalFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeGoal(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2 space-y-2">
                            <Label>Goal Title *</Label>
                            <Input
                              placeholder="What do you want to achieve?"
                              {...register(`goals.${index}.title`)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                              onValueChange={(value) =>
                                setValue(
                                  `goals.${index}.priority`,
                                  value as any,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            placeholder="Describe this goal in detail..."
                            rows={2}
                            {...register(`goals.${index}.description`)}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Budget Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget Information
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Budget</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="1000"
                      {...register("budget.min", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Budget</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="5000"
                      {...register("budget.max", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("budget.currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget Summary */}
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Budget Estimation</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Estimated Total:
                        </span>{" "}
                        {watchedBudget.currency} {estimatedCost.toFixed(0)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Per Session:
                        </span>{" "}
                        {watchedBudget.currency}{" "}
                        {(
                          estimatedCost / watchedTimeline.totalSessions
                        ).toFixed(0)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Per Participant:
                        </span>{" "}
                        {watchedBudget.currency}{" "}
                        {participantFields.length > 0
                          ? (estimatedCost / participantFields.length).toFixed(
                              0,
                            )
                          : 0}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Per Hour:</span>{" "}
                        {watchedBudget.currency}{" "}
                        {(
                          estimatedCost /
                          (watchedTimeline.totalSessions *
                            watchedTimeline.hoursPerSession)
                        ).toFixed(0)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => navigate(-1))}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Creating Program..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Program
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProgramCreationForm;
