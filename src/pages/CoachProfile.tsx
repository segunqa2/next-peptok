import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
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

const CoachProfile = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  // Load coach data from backend API
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoach = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/v1/coaches/${id}`,
        );
        if (!response.ok) {
          throw new Error("Coach not found");
        }
        const coachData = await response.json();
        setCoach(coachData);
      } catch (error) {
        console.warn("Coach data unavailable - backend service down");
        setCoach(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCoach();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading coach profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Coach profile not available - backend service unavailable</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Enhanced mock data for coach profile
  const reviews = [
    {
      id: "1",
      enterpriseName: "Alex Johnson",
      enterpriseTitle: "Software Engineer",
      enterpriseAvatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop&crop=face",
      rating: 5,
      comment:
        "Sarah is an exceptional coach. Her insights on leadership have transformed my approach to team management. The practical frameworks she shared have been invaluable.",
      date: "2 weeks ago",
      verified: true,
      helpful: 12,
    },
    {
      id: "2",
      enterpriseName: "Emily Davis",
      enterpriseTitle: "Product Manager",
      enterpriseAvatar:
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
      enterpriseName: "Michael Chen",
      enterpriseTitle: "Engineering Manager",
      enterpriseAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      rating: 4,
      comment:
        "Great coach with excellent communication skills. Sessions are always valuable and well-structured. Sarah provides actionable insights every time.",
      date: "2 months ago",
      verified: true,
      helpful: 15,
    },
    {
      id: "4",
      enterpriseName: "Lisa Park",
      enterpriseTitle: "Senior Developer",
      enterpriseAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      rating: 5,
      comment:
        "Sarah has a unique ability to break down complex leadership concepts into practical, actionable steps. My confidence as a team lead has grown tremendously.",
      date: "3 months ago",
      verified: true,
      helpful: 6,
    },
  ];

  const achievements = [
    "Led 50+ enterprise professionals to senior roles",
    "95% success rate in leadership development programs",
    "Authored 'The Remote Leadership Handbook'",
    "Featured speaker at TechLead Conference 2023",
    "Coached 200+ professionals across 15+ countries",
    "Former VP of Engineering at leading tech companies",
  ];

  const coaching = [
    "Remote Team Leadership",
    "Technical Team Management",
    "Engineering Career Development",
    "Startup Scaling Strategies",
    "Cross-functional Collaboration",
    "Technical Decision Making",
    "Performance Management",
    "Hiring and Team Building",
  ];

  const learningMaterials = [
    {
      id: "1",
      title: "Leadership Fundamentals for Tech Teams",
      type: "Video Course",
      duration: "2h 30m",
      downloads: 1250,
      rating: 4.9,
      thumbnail:
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop",
    },
    {
      id: "2",
      title: "Remote Team Management Playbook",
      type: "PDF Guide",
      duration: "45 pages",
      downloads: 890,
      rating: 4.8,
      thumbnail:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
    },
    {
      id: "3",
      title: "1:1 Meeting Templates and Best Practices",
      type: "Template Pack",
      duration: "12 templates",
      downloads: 2100,
      rating: 4.7,
      thumbnail:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
  ];

  const upcomingSessions = [
    {
      id: "1",
      title: "Leadership Workshop",
      date: "Dec 20, 2024",
      time: "2:00 PM",
      duration: "2 hours",
      type: "Group Session",
      spots: 3,
      maxSpots: 8,
      price: 150,
      description: "Standard coaching session",
    },
    {
      id: "2",
      title: "1:1 Coaching Session",
      date: "Dec 22, 2024",
      time: "10:00 AM",
      duration: "1 hour",
      type: "Individual",
      spots: 1,
      maxSpots: 1,
      price: 200,
      description: "Personalized coaching session",
    },
  ];

  const sessionHistory = [
    {
      id: "1",
      title: "Remote Team Leadership Deep Dive",
      date: "Dec 1, 2024",
      duration: "1.5 hours",
      rating: 5,
      feedback: "Excellent session with actionable insights",
    },
    {
      id: "2",
      title: "Performance Management Workshop",
      date: "Nov 25, 2024",
      duration: "2 hours",
      rating: 5,
      feedback: "Very helpful practical frameworks",
    },
  ];

  const stats = [
    { label: "Total Sessions", value: coach.totalSessions, icon: Calendar },
    { label: "Average Rating", value: coach.rating, icon: Star },
    { label: "Response Time", value: "< 2 hours", icon: Clock },
    { label: "Success Rate", value: "95%", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userType="enterprise" />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coach Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Basic Info Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={coach.avatar} alt={coach.name} />
                      <AvatarFallback>
                        {coach.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="mb-4">
                      <h1 className="text-2xl font-bold">{coach.name}</h1>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Verified Coach
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <p className="text-lg font-medium text-gray-900">
                        {coach.title}
                      </p>
                      <p className="text-gray-600">{coach.company}</p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center space-x-2 mb-6">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= Math.floor(coach.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{coach.rating}</span>
                      <span className="text-gray-500">
                        ({coach.totalSessions} sessions)
                      </span>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {coach.experience}
                        </div>
                        <div className="text-sm text-gray-600">Years Exp</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {coach.totalSessions}
                        </div>
                        <div className="text-sm text-gray-600">Sessions</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {isAuthenticated ? (
                        <>
                          <Button className="w-full" size="lg">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Session
                          </Button>
                          <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                            <Button variant="outline" size="icon">
                              <Share className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button asChild className="w-full" size="lg">
                            <a href="/login">
                              <Calendar className="w-4 h-4 mr-2" />
                              Sign In to Book Session
                            </a>
                          </Button>
                          <div className="flex space-x-2">
                            <Button
                              asChild
                              variant="outline"
                              className="flex-1"
                            >
                              <a href="/signup">
                                <Users className="w-4 h-4 mr-2" />
                                Create Account
                              </a>
                            </Button>
                            <Button variant="outline" size="icon">
                              <Share className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-blue-800 text-sm">
                              <strong>Sign in required:</strong> Create an
                              account to message coaches, book sessions, and
                              access full profiles.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">San Francisco, CA</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">UTC-8 (PST)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          Usually responds within 2 hours
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm font-medium">
                          Contact details hidden
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          <a
                            href="/login"
                            className="text-blue-600 hover:underline"
                          >
                            Sign in
                          </a>{" "}
                          to view location, timezone, and response time
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <stat.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {coach.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-gray-700 leading-relaxed">{coach.bio}</p>

                    <Separator />

                    {/* Achievements */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-yellow-500" />
                        Key Achievements
                      </h3>
                      <ul className="space-y-2">
                        {achievements.map((achievement, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-sm">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Coaching Areas */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-blue-500" />
                        <span>Coaching Areas</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {coaching.map((skill, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        What clients are saying about {coach.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-semibold">{coach.rating}</span>
                        <span className="text-gray-500">
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-b-0"
                      >
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage
                              src={review.enterpriseAvatar}
                              alt={review.enterpriseName}
                            />
                            <AvatarFallback>
                              {review.enterpriseName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium">
                                  {review.enterpriseName}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {review.enterpriseTitle}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">
                              {review.comment}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{review.date}</span>
                              <div className="flex items-center space-x-4">
                                {review.verified && (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Verified Client</span>
                                  </div>
                                )}
                                <button className="flex items-center space-x-1 hover:text-gray-700">
                                  <Heart className="w-4 h-4" />
                                  <span>Helpful ({review.helpful})</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Book a session with {coach.name}</CardTitle>
                    <CardDescription>
                      Choose from available coaching sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {session.title}
                            </h3>
                            <p className="text-gray-600">
                              {session.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>
                                {session.date} at {session.time}
                              </span>
                              <span>{session.duration}</span>
                              <Badge variant="outline">{session.type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              ${session.price}
                            </p>
                            <p className="text-sm text-gray-500">
                              {session.spots} of {session.maxSpots} spots left
                            </p>
                          </div>
                        </div>
                        <Button className="w-full">Book Now</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Session History</CardTitle>
                    <CardDescription>
                      Your past and upcoming sessions with {coach.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sessionHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Schedule your first session with {coach.name} to get
                          started on your coaching journey.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessionHistory.map((session) => (
                          <div
                            key={session.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{session.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {session.date}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {session.duration}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= session.rating
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {session.feedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Learning materials and resources shared by {coach.name}
                    </CardTitle>
                    <CardDescription>
                      Access exclusive content and coaching materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {learningMaterials.map((material) => (
                        <div
                          key={material.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="flex">
                            <img
                              src={material.thumbnail}
                              alt={material.title}
                              className="w-32 h-24 object-cover"
                            />
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">
                                    {material.title}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                    <Badge variant="outline">
                                      {material.type}
                                    </Badge>
                                    <span>{material.duration}</span>
                                    <div className="flex items-center">
                                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                      {material.rating}
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm">
                                  <Download className="w-4 h-4 mr-2" />
                                  Access
                                </Button>
                              </div>
                              <p className="text-sm text-gray-500">
                                {material.downloads.toLocaleString()} downloads
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Coach Availability</CardTitle>
                    <CardDescription>
                      View available time slots and book sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Interactive Calendar
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Book sessions directly from the coach's calendar
                      </p>
                      <Button>
                        <Calendar className="w-4 h-4 mr-2" />
                        View Full Calendar
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
  );
};

export default CoachProfile;
