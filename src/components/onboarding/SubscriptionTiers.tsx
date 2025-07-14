import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionTier } from "@/types";
import { apiEnhanced as api } from "@/services/apiEnhanced";
import { toast } from "sonner";

interface SubscriptionTiersProps {
  onSelectTier: (tier: SubscriptionTier) => void;
  onBack?: () => void;
  selectedTier?: string;
  isLoading?: boolean;
}

export function SubscriptionTiers({
  onSelectTier,
  onBack,
  selectedTier,
  isLoading,
}: SubscriptionTiersProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [subscriptionTiers, setSubscriptionTiers] = useState<
    SubscriptionTier[]
  >([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Load subscription tiers from API
  useEffect(() => {
    const loadSubscriptionTiers = async () => {
      try {
        setLoadingTiers(true);
        const tiers = await api.getSubscriptionTiers();
        setSubscriptionTiers(tiers);
      } catch (error) {
        console.error("Failed to load subscription tiers:", error);
        toast.error("Failed to load pricing plans. Please try again.");
      } finally {
        setLoadingTiers(false);
      }
    };

    loadSubscriptionTiers();
  }, []);

  const formatPrice = (tier: SubscriptionTier) => {
    if (tier.customPricing) {
      return "Custom pricing";
    }

    const price =
      billingPeriod === "annual" ? tier.priceAnnual || tier.price : tier.price;
    const currency = tier.currency || "CAD";

    return `${currency}$${price}/user/month`;
  };

  const getDisplayPrice = (tier: SubscriptionTier) => {
    if (tier.customPricing) {
      return {
        amount: "Custom",
        period: "pricing",
        savings: null,
      };
    }

    const monthlyPrice = tier.price;
    const annualPrice = tier.priceAnnual || tier.price * 12 * 0.9; // 10% discount if no annual price set

    if (billingPeriod === "annual") {
      const monthlySavings = monthlyPrice * 12 - annualPrice;
      return {
        amount: `CA$${annualPrice.toFixed(0)}`,
        period: "/year",
        savings: `Save CA$${monthlySavings.toFixed(0)}/year`,
      };
    }

    return {
      amount: `CA$${monthlyPrice}`,
      period: "/user/month",
      savings: null,
    };
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier.id) {
      case "starter":
        return Zap;
      case "growth":
        return Crown;
      case "enterprise":
        return Building2;
      default:
        return Zap;
    }
  };

  if (loadingTiers) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Loading Pricing Plans...</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Please wait while we load the latest pricing information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
          <CardDescription>
            Select the plan that best fits your organization's coaching needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg">
              <Button
                variant={billingPeriod === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("monthly")}
                className="rounded-md"
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === "annual" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingPeriod("annual")}
                className="rounded-md ml-1"
              >
                Annual
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 10%
                </Badge>
              </Button>
            </div>
          </div>

          {/* Subscription Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionTiers.map((tier) => {
              const Icon = getTierIcon(tier);
              const isSelected = selectedTier === tier.id;
              const isPopular = tier.badge === "Best Value";
              const displayPrice = getDisplayPrice(tier);

              return (
                <Card
                  key={tier.id}
                  className={cn(
                    "relative transition-all duration-300 hover:shadow-lg border-2",
                    isSelected && "border-primary shadow-lg",
                    isPopular && "border-blue-200 shadow-md",
                    !isSelected &&
                      !isPopular &&
                      "border-border hover:border-border/80",
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                        {tier.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center space-y-4">
                    <div
                      className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
                        isPopular ? "bg-blue-100" : "bg-muted",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6",
                          isPopular ? "text-blue-600" : "text-muted-foreground",
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {tier.description}
                      </CardDescription>
                    </div>

                    {/* Pricing Display */}
                    <div className="space-y-2">
                      <div className="flex items-end justify-center space-x-1">
                        <span className="text-3xl font-bold">
                          {displayPrice.amount}
                        </span>
                        <span className="text-muted-foreground text-sm mb-1">
                          {displayPrice.period}
                        </span>
                      </div>
                      {displayPrice.savings && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          {displayPrice.savings}
                        </Badge>
                      )}
                      {tier.minimumUsers && tier.minimumUsers > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Minimum {tier.minimumUsers} users
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Features included:
                      </h4>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metrics Included */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">
                        Analytics & Metrics:
                      </h4>
                      <ul className="space-y-1">
                        {tier.metricsIncluded.map((metric, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2 text-sm text-muted-foreground"
                          >
                            <Check className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                            <span>{metric}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Extra Seat Pricing */}
                    {tier.extraSeatPrice && tier.extraSeatPrice > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Additional seats: CA${tier.extraSeatPrice}/user/month
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => onSelectTier(tier)}
                      disabled={isLoading}
                      className={cn(
                        "w-full",
                        isPopular &&
                          "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                      )}
                      variant={isPopular ? "default" : "outline"}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : tier.customPricing ? (
                        "Contact Sales"
                      ) : (
                        "Start Now"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Information */}
          <div className="mt-8 text-center space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Need help choosing?</h4>
              <p className="text-sm text-muted-foreground">
                All plans include secure payment processing, GDPR compliance,
                and 24/7 platform availability. Contact our sales team for
                custom enterprise solutions.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            {onBack && (
              <Button variant="outline" onClick={onBack} disabled={isLoading}>
                Back
              </Button>
            )}
            <div className="flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
