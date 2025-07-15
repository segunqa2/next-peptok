import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Calendar,
  Users,
  MessageSquare,
  Video,
  Clock,
  Award,
  BookOpen,
  Target,
  MapPin,
  Globe,
  CheckCircle,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Heart,
  Share,
  Bookmark,
  Play,
  Download,
} from "lucide-react";
// Removed mock coaches - will use backend API

const ExpertProfile = () => {
  const { id } = useParams();
  // Load expert data from backend API
  const [expert, setExpert] = useState<any>(null);

  useEffect(() => {
    const loadExpert = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/v1/coaches/${id}`,
        );
        if (!response.ok) {
          throw new Error("Expert not found");
        }
        const expertData = await response.json();
        setExpert(expertData);
      } catch (error) {
        console.warn("Expert data unavailable - backend service down");
        setExpert(null);
      }
    };

    if (id) {
      loadExpert();
    }
  }, [id]);

  if (!expert) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Expert profile not available - backend service unavailable</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Enhanced mock data for expert profile
  const reviews = [
    {
      id: "1",
      employeeName: "Alex Johnson",
      employeeTitle: "Software Engineer",
      employeeAvatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face",
      rating: 5,
      comment:
        "Sarah is an exceptional mentor. Her insights on leadership have transformed my approach to team management. The practical frameworks she shared have been invaluable.",
      date: "2 weeks ago",
      verified: true,
      helpful: 12,
    },
    {
      id: "2",
      employeeName: "Emily Davis",
      employeeTitle: "Product Manager",
      employeeAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9d3cc57?w=400&h=400&fit=crop&crop=face",
      rating: 5,
      comment:
        "Incredible depth of knowledge and very practical advice. Sarah helped me navigate a complex team restructuring with confidence. Highly recommend!",
      date: "1 month ago",
      verified: true,
      helpful: 8,
    },
    {
      id: "3",
      employeeName: "Michael Chen",
      employeeTitle: "Engineering Manager",
      employeeAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      rating: 4,
      comment:
        "Great mentor with excellent communication skills. Sessions are always valuable and well-structured. Sarah provides actionable insights every time.",
      date: "2 months ago",
      verified: true,
      helpful: 15,
    },
    {
      id: "4",
      employeeName: "Lisa Park",
      employeeTitle: "Senior Developer",
      employeeAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      rating: 5,
      comment:
        "Sarah has a unique ability to break down complex leadership concepts into practical, actionable steps. My confidence as a team lead has grown tremendously.",
      date: "3 months ago",
      verified: true,
      helpful: 6,
    },
  ];

  const certifications = [
    {
      name: "Certified Executive Coach (ICF)",
      issuer: "International Coaching Federation",
      year: "2018",
    },
    {
      name: "Leadership Development Specialist",
      issuer: "Harvard Business School",
      year: "2019",
    },
    {
      name: "Agile Certified Practitioner",
      issuer: "Project Management Institute",
      year: "2017",
    },
    {
      name: "Product Management Professional",
      issuer: "Product School",
      year: "2020",
    },
  ];

  const achievements = [
    "Led engineering teams of 100+ developers at Google",
    "Scaled products from 0 to 10M+ users across 3 major releases",
    "Mentored 50+ senior engineers into leadership roles",
    "Speaker at 20+ tech conferences worldwide",
    "Published 15+ articles on engineering leadership",
    "Established diversity & inclusion programs adopted company-wide",
  ];

  const expertise = [
    { skill: "Technical Leadership", level: 95, years: 15 },
    { skill: "Team Building", level: 92, years: 12 },
    { skill: "Product Strategy", level: 88, years: 10 },
    { skill: "Agile Methodologies", level: 90, years: 8 },
    { skill: "Engineering Culture", level: 94, years: 14 },
    { skill: "Scaling Organizations", level: 96, years: 12 },
  ];

  const upcomingAvailability = [
    { date: "Today", slots: ["2:00 PM", "4:00 PM"] },
    { date: "Tomorrow", slots: ["10:00 AM", "2:00 PM", "5:00 PM"] },
    { date: "Wed, Jan 15", slots: ["9:00 AM", "1:00 PM"] },
    { date: "Fri, Jan 17", slots: ["11:00 AM", "3:00 PM", "6:00 PM"] },
  ];

  const resources = [
    {
      id: "1",
      title: "Leadership Framework for Technical Teams",
      type: "PDF Guide",
      description:
        "Comprehensive guide for transitioning from IC to engineering manager",
      downloads: 1250,
      rating: 4.8,
    },
    {
      id: "2",
      title: "Building High-Performance Engineering Culture",
      type: "Video Series",
      description:
        "6-part video series on creating effective engineering teams",
      downloads: 890,
      rating: 4.9,
    },
    {
      id: "3",
      title: "Technical Decision Making Template",
      type: "Worksheet",
      description: "Template for structured technical decision making process",
      downloads: 2100,
      rating: 4.7,
    },
  ];

  const sessionPricing = [
    {
      duration: "30 min",
      price: 150,
      description: "Quick consultation or follow-up",
    },
    {
      duration: "60 min",
      price: 250,
      description: "Standard mentoring session",
    },
    {
      duration: "90 min",
      price: 350,
      description: "Deep-dive session or workshop",
    },
  ];

  const stats = [
    { label: "Total Sessions", value: expert.totalSessions, icon: Calendar },
    { label: "Success Rate", value: "96%", icon: TrendingUp },
    { label: "Response Time", value: "< 2h", icon: Clock },
    { label: "Repeat Clients", value: "78%", icon: Heart },
  ];

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-100/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Header userType="employee" />

        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Expert Info Sidebar */}
            <div className="space-y-6">
              {/* Main Profile Card */}
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-lg">
                        <AvatarImage src={expert.avatar} alt={expert.name} />
                        <AvatarFallback className="text-2xl">
                          {expert.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-green-500 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <h1 className="text-2xl font-bold">{expert.name}</h1>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          Verified
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {expert.title}
                      </p>
                      <p className="text-primary font-semibold">
                        {expert.company}
                      </p>
                      <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>San Francisco, CA</span>
                      </div>
                    </div>

                    {/* Rating & Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < Math.floor(expert.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{expert.rating}</span>
                        <span className="text-muted-foreground">
                          ({reviews.length} reviews)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">
                            {expert.experience}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Years Experience
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {expert.totalSessions}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sessions Completed
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        size="lg"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Session
                      </Button>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-muted-foreground">
                            {stat.label}
                          </span>
                        </div>
                        <span className="font-semibold">{stat.value}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Session Pricing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessionPricing.map((pricing, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{pricing.duration}</p>
                        <p className="text-xs text-muted-foreground">
                          {pricing.description}
                        </p>
                      </div>
                      <p className="font-bold text-blue-600">
                        ${pricing.price}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="availability">Schedule</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-6">
                  {/* Bio */}
                  <Card>
                    <CardHeader>
                      <CardTitle>About {expert.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {expert.bio}
                      </p>

                      <Separator />

                      {/* Key Achievements */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center space-x-2">
                          <Award className="h-4 w-4" />
                          <span>Key Achievements</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {achievements.map((achievement, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2 text-sm"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{achievement}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Expertise Areas */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center space-x-2">
                          <Target className="h-4 w-4" />
                          <span>Expertise Areas</span>
                        </h4>
                        <div className="space-y-4">
                          {expertise.map((skill, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {skill.skill}
                                </span>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <span>{skill.years} years</span>
                                  <span>•</span>
                                  <span>{skill.level}%</span>
                                </div>
                              </div>
                              <Progress value={skill.level} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Certifications */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>Certifications</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {certifications.map((cert, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">
                                  {cert.name}
                                </h5>
                                <p className="text-xs text-muted-foreground">
                                  {cert.issuer}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {cert.year}
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Reviews & Feedback</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            ({reviews.length} reviews)
                          </span>
                        </div>
                      </div>
                      <CardDescription>
                        What mentees are saying about {expert.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Rating Distribution */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviews.filter(
                            (r) => r.rating === rating,
                          ).length;
                          const percentage = (count / reviews.length) * 100;
                          return (
                            <div
                              key={rating}
                              className="flex items-center space-x-3"
                            >
                              <span className="text-sm w-8">{rating}★</span>
                              <Progress
                                value={percentage}
                                className="flex-1 h-2"
                              />
                              <span className="text-sm text-muted-foreground w-8">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <Separator />

                      {/* Individual Reviews */}
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="space-y-3 p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={review.employeeAvatar}
                                    alt={review.employeeName}
                                  />
                                  <AvatarFallback>
                                    {review.employeeName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-sm">
                                      {review.employeeName}
                                    </p>
                                    {review.verified && (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {review.employeeTitle}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex space-x-1 mb-1">
                                  {Array.from({ length: review.rating }).map(
                                    (_, i) => (
                                      <Star
                                        key={i}
                                        className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                      />
                                    ),
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {review.date}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>Helpful?</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                >
                                  👍 {review.helpful}
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                              >
                                Report
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="availability" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Available Time Slots</span>
                      </CardTitle>
                      <CardDescription>
                        Book a session with {expert.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {upcomingAvailability.map((day, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-medium text-sm border-b pb-2">
                            {day.date}
                          </h4>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {day.slots.map((slot, slotIndex) => (
                              <Button
                                key={slotIndex}
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="text-center pt-4">
                        <Button variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Full Calendar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Shared Resources</span>
                      </CardTitle>
                      <CardDescription>
                        Learning materials and resources shared by {expert.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resources.map((resource) => (
                        <Card
                          key={resource.id}
                          className="p-4 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">
                                  {resource.title}
                                </h4>
                                <Badge variant="secondary">
                                  {resource.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {resource.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Download className="h-3 w-3" />
                                  <span>
                                    {resource.downloads.toLocaleString()}{" "}
                                    downloads
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{resource.rating}</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session History</CardTitle>
                      <CardDescription>
                        Your past and upcoming sessions with {expert.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          No sessions yet
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Schedule your first session with {expert.name} to get
                          started on your mentorship journey.
                        </p>
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule First Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default ExpertProfile;
