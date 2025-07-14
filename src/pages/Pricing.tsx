import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Calculator,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useAuth } from "@/contexts/AuthContext";

// Dynamic pricing - will be loaded from API
let PLATFORM_SERVICE_FEE = 0.1; // 10% default
let ADDITIONAL_PARTICIPANT_FEE = 25; // $25 per additional participant default

export default function Pricing() {
  const { user } = useAuth();
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessions, setSessions] = useState(8);
  const [participants, setParticipants] = useState(3);
  const [coachRate, setCoachRate] = useState(150);
  const [pricingConfig, setPricingConfig] = useState({
    companyServiceFee: 0.1,
    coachCommission: 0.2,
    additionalParticipantFee: 25,
    currency: "CAD",
  });

  useEffect(() => {
    const fetchPricingConfig = async () => {
      try {
        const config = await apiEnhanced.getPricingConfig();
        setPricingConfig(config);
        PLATFORM_SERVICE_FEE = config.companyServiceFee;
        ADDITIONAL_PARTICIPANT_FEE = config.additionalParticipantFee;
      } catch (error) {
        console.warn("Using default pricing config:", error);
      }
    };
    fetchPricingConfig();
  }, []);

  const calculateCosts = () => {
    const sessionCost = (coachRate * sessionDuration) / 60;
    const baseSessionsCost = sessions * sessionCost;
    const maxIncluded = pricingConfig.maxParticipantsIncluded || 1;
    const additionalParticipantsCost =
      Math.max(0, participants - maxIncluded) *
      pricingConfig.additionalParticipantFee *
      sessions;
    const subtotal = baseSessionsCost + additionalParticipantsCost;

    // Different fee structure for companies vs coaches
    const platformFee =
      user?.userType === "company"
        ? subtotal * pricingConfig.companyServiceFee
        : Math.max(
            baseSessionsCost * pricingConfig.coachCommission,
            (pricingConfig.minCoachCommissionAmount || 0) * sessions,
          );

    const totalCost = subtotal + platformFee;

    return {
      sessionCost: coachRate,
      baseSessionsCost,
      additionalParticipantsCost,
      subtotal,
      platformFee,
      totalCost,
      coachEarnings:
        user?.userType === "coach"
          ? baseSessionsCost - platformFee
          : baseSessionsCost,
      averageCostPerSession: totalCost / sessions,
    };
  };

  const costs = calculateCosts();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {user?.userType === "coach"
                ? "Coach Earnings"
                : "Simple, Transparent"}{" "}
              <span className="text-blue-600">
                {user?.userType === "coach" ? "Calculator" : "Pricing"}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {user?.userType === "coach"
                ? "Understand your earnings with our transparent commission structure. Set your rates and see what you'll earn."
                : "Pay only for the coaching sessions your team receives. No hidden fees, no long-term contracts."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Get Started
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/coach-directory">
                  <Users className="mr-2 h-5 w-5" />
                  Browse Coaches
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Calculator */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50/50 to-gray-100/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Calculator className="w-8 h-8 text-blue-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {user?.userType === "coach" ? "Earnings" : "Cost"} Calculator
                </h2>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {user?.userType === "coach"
                  ? "Calculate your potential earnings based on your rates and session frequency"
                  : "Estimate your coaching program costs based on your specific needs"}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calculator Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {user?.userType === "coach"
                      ? "Session Settings"
                      : "Program Settings"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Coach Rate */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {user?.userType === "coach"
                          ? "Your Hourly Rate"
                          : "Coach Hourly Rate"}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        ${coachRate} {pricingConfig.currency}/hour
                      </span>
                    </div>
                    <Slider
                      value={[coachRate]}
                      onValueChange={(value) => setCoachRate(value[0])}
                      max={500}
                      min={50}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  {/* Session Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Session Duration
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {sessionDuration} minutes
                      </span>
                    </div>
                    <Slider
                      value={[sessionDuration]}
                      onValueChange={(value) => setSessionDuration(value[0])}
                      max={180}
                      min={30}
                      step={30}
                      className="w-full"
                    />
                  </div>

                  {/* Number of Sessions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Number of Sessions
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {sessions} sessions
                      </span>
                    </div>
                    <Slider
                      value={[sessions]}
                      onValueChange={(value) => setSessions(value[0])}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {user?.userType !== "coach" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Participants
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {participants} people
                        </span>
                      </div>
                      <Slider
                        value={[participants]}
                        onValueChange={(value) => setParticipants(value[0])}
                        max={1000}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {user?.userType === "coach"
                      ? "Earnings Breakdown"
                      : "Cost Breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {user?.userType === "coach"
                          ? "Session revenue"
                          : "Coach earnings"}{" "}
                        ({sessions} × ${costs.sessionCost.toFixed(0)})
                      </span>
                      <span className="font-medium">
                        ${costs.baseSessionsCost.toFixed(2)}
                      </span>
                    </div>

                    {user?.userType !== "coach" &&
                      costs.additionalParticipantsCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Additional participants ({sessions} ×{" "}
                            {Math.max(
                              0,
                              participants -
                                (pricingConfig.maxParticipantsIncluded || 1),
                            )}{" "}
                            × ${pricingConfig.additionalParticipantFee})
                          </span>
                          <span className="font-medium">
                            ${costs.additionalParticipantsCost.toFixed(2)}
                          </span>
                        </div>
                      )}

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="font-medium">
                        ${costs.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {user?.userType === "coach"
                          ? `Platform commission (${(pricingConfig.coachCommission * 100).toFixed(0)}%)`
                          : `Platform service fee (${(pricingConfig.companyServiceFee * 100).toFixed(0)}%)`}
                      </span>
                      <span className="font-medium">
                        {user?.userType === "coach" ? "-" : ""}$
                        {costs.platformFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {user?.userType === "coach"
                            ? "Your Net Earnings"
                            : "Total Program Cost"}
                        </span>
                        <span className="font-bold text-blue-600">
                          $
                          {user?.userType === "coach"
                            ? costs.coachEarnings.toFixed(2)
                            : costs.totalCost.toFixed(2)}{" "}
                          {pricingConfig.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {user?.userType === "coach"
                          ? "Per session earnings"
                          : "Average cost per session"}
                      </span>
                      <span className="font-medium">
                        $
                        {user?.userType === "coach"
                          ? (costs.coachEarnings / sessions).toFixed(2)
                          : costs.averageCostPerSession.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {user?.userType === "coach"
                            ? "Maximize Your Earnings"
                            : "Cost Optimization Tips"}
                        </p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          {user?.userType === "coach" ? (
                            <>
                              <li>• Higher rates attract premium clients</li>
                              <li>
                                • Longer sessions improve hourly efficiency
                              </li>
                              <li>
                                • Regular clients reduce acquisition costs
                              </li>
                            </>
                          ) : (
                            <>
                              <li>
                                • Longer sessions provide better value per hour
                              </li>
                              <li>
                                • Group sessions reduce per-person costs
                                significantly
                              </li>
                              <li>
                                • Regular sessions show better ROI over time
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Pricing FAQ
              </h2>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about our pricing model
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Why session-based pricing?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Session-based pricing provides maximum flexibility and
                    transparency. You only pay for the coaching your team
                    actually receives, with no monthly commitments or hidden
                    fees.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    How are coach rates determined?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Coaches set their own rates based on their expertise and
                    experience. Rates typically range from $100-300{" "}
                    {pricingConfig.currency} per hour, with most coaches
                    charging $150-200 {pricingConfig.currency} per hour.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    What's included in the{" "}
                    {user?.userType === "coach" ? "commission" : "service fee"}?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The{" "}
                    {user?.userType === "coach"
                      ? `${(pricingConfig.coachCommission * 100).toFixed(0)}% commission covers`
                      : `${(pricingConfig.companyServiceFee * 100).toFixed(0)}% platform service fee covers`}{" "}
                    coach matching, payment processing, quality assurance,
                    customer support, session recordings, and platform
                    maintenance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {user?.userType === "coach"
                      ? "When do I get paid?"
                      : "When are payments processed?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {user?.userType === "coach"
                      ? "Payments are processed weekly, every Friday, for all completed sessions from the previous week."
                      : "Payments are charged immediately when booking a session. Refunds are available according to our cancellation policy."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {user?.userType === "coach"
                ? "Start Earning Today"
                : "Ready to Get Started?"}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {user?.userType === "coach"
                ? "Join our platform and start coaching with transparent, competitive rates."
                : "Start your coaching program today with our transparent, pay-per-session pricing model."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/dashboard">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Get Started
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10"
                asChild
              >
                <a href="mailto:sales@peptok.ca?subject=Sales Inquiry - Pricing Information">
                  Contact Sales
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
