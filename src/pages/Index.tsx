import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// Removed demo data imports - will use backend API
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  Shield,
  Building,
  UserCheck,
  Zap,
  Play,
  ChevronRight,
  BarChart3,
  BookOpen,
  Clock,
  Globe,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Award,
  Video,
  Coffee,
  Briefcase,
  GraduationCap,
} from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    // Load platform statistics from backend API
    const loadStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/v1/platform/statistics",
        );
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }
        const stats = await response.json();
        setPlatformStats(stats);
        setBackendAvailable(true);
      } catch (error) {
        console.warn("Platform statistics unavailable - backend service down");
        setBackendAvailable(false);
        setPlatformStats({
          totalCoaches: 0,
          totalSessions: 0,
          averageRating: 0,
          totalCompanies: 0,
        });
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Professional Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-blue-100/50"></div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s" }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "8s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "10s" }}
          ></div>
        </div>
      </div>

      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8 animate-in slide-in-from-left duration-1000">
                {/* Premium Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300/50 shadow-lg backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-semibold text-blue-800">
                    Enterprise-Grade Coaching Platform
                  </span>
                </div>

                {/* Main Heading */}
                <div className="space-y-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent leading-tight">
                    Transform Your Team with
                    <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Expert Coaching
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Connect your employees with world-class coaches and mentors.
                    Drive growth, boost performance, and unlock potential with
                    our comprehensive coaching platform.
                  </p>
                </div>

                {/* Enhanced Value Props */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Users, text: "Expert Coach Matching" },
                    { icon: Target, text: "Goal-Driven Programs" },
                    { icon: BarChart3, text: "Real-Time Analytics" },
                    { icon: Shield, text: "Enterprise Security" },
                  ].map((prop, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <prop.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">
                        {prop.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-3"
                    onClick={() => navigate("/signup")}
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center space-x-3 pt-6 border-t border-gray-200/50">
                  <div className="flex items-center space-x-1">
                    <Zap className="mr-1 h-3 w-3" />
                    Trusted by {platformStats?.totalCompanies || 0}+ companies
                    worldwide
                  </div>
                </div>
              </div>

              {/* Right Column - Enhanced Visual + Stats */}
              <div className="space-y-8">
                {/* Enhanced Stats - Backend API Data */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {platformStats?.totalCoaches || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Professional Coaches
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {platformStats?.totalSessions || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Sessions Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {platformStats?.averageRating || 0}/5.0
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {platformStats?.totalCompanies || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Companies Served
                    </div>
                  </div>
                </div>

                {/* Enhanced Visual */}
                <div className="relative animate-in slide-in-from-right duration-1000 delay-300">
                  <div className="relative z-10 bg-gradient-to-br from-blue-50/90 to-blue-100/70 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                    <div className="space-y-6">
                      {/* Expert Cards Preview */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                              <div className="h-2 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse"></div>
                            <div className="space-y-1">
                              <div className="h-3 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                              <div className="h-2 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Preview */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/40">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
                            <div className="h-6 w-6 bg-gradient-to-r from-green-200 to-green-300 rounded animate-pulse"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gradient-to-r from-blue-200 to-blue-300 rounded animate-pulse"></div>
                            <div className="h-2 w-3/4 bg-gradient-to-r from-blue-200 to-blue-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need for success
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our comprehensive platform provides all the tools and features
                needed to deliver exceptional coaching experiences at scale.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: UserCheck,
                  title: "Expert Coach Matching",
                  description:
                    "AI-powered matching connects your team with the perfect coaches based on goals, industry, and expertise.",
                  color: "blue",
                },
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description:
                    "Automated scheduling system that works across time zones with calendar integration and reminders.",
                  color: "green",
                },
                {
                  icon: BarChart3,
                  title: "Progress Analytics",
                  description:
                    "Comprehensive dashboards track progress, measure ROI, and provide actionable insights.",
                  color: "purple",
                },
                {
                  icon: Video,
                  title: "HD Video Sessions",
                  description:
                    "Crystal-clear video calls with screen sharing, recording, and collaboration tools built-in.",
                  color: "indigo",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description:
                    "Bank-grade security with SOC 2 compliance, SSO integration, and data encryption.",
                  color: "red",
                },
                {
                  icon: Globe,
                  title: "Global Reach",
                  description:
                    "Access coaches worldwide with multi-language support and local timezone coordination.",
                  color: "emerald",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <CardHeader>
                    <div
                      className={`h-12 w-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4`}
                    >
                      <feature.icon
                        className={`h-6 w-6 text-${feature.color}-600`}
                      />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to transform your team?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of companies using Peptok to develop their talent
              and drive business results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 font-semibold"
                onClick={() => navigate("/signup")}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
