import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  X,
  Check,
  CreditCard,
  Zap,
  Star,
  Users,
  ArrowUp,
  Loader,
} from "lucide-react";
import { SubscriptionTier } from "../../types";
import { toast } from "react-hot-toast";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_example",
);

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  availableTiers: SubscriptionTier[];
  onUpgrade: (tierId: string, paymentMethodId?: string) => Promise<void>;
  additionalSeats?: number;
  onPurchaseSeats?: (
    quantity: number,
    paymentMethodId: string,
  ) => Promise<void>;
}

interface PaymentFormProps {
  onSubmit: (paymentMethodId: string) => Promise<void>;
  isLoading: boolean;
  amount: number;
  description: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isLoading,
  amount,
  description,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setError(null);

    const { error: stripeError, paymentMethod } =
      await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

    if (stripeError) {
      setError(stripeError.message || "An error occurred");
      return;
    }

    if (paymentMethod) {
      try {
        await onSubmit(paymentMethod.id);
      } catch (err) {
        setError("Payment failed. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Information
        </label>
        <div className="border border-gray-300 rounded-lg p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">{description}</span>
          <span className="text-lg font-semibold">${amount}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Complete Payment</span>
          </>
        )}
      </button>
    </form>
  );
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  availableTiers,
  onUpgrade,
  additionalSeats = 0,
  onPurchaseSeats,
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [upgradeMode, setUpgradeMode] = useState<"tier" | "seats">("tier");
  const [seatQuantity, setSeatQuantity] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"selection" | "payment">("selection");

  useEffect(() => {
    if (isOpen) {
      setStep("selection");
      setSelectedTier(null);
      setUpgradeMode("tier");
    }
  }, [isOpen]);

  const handleTierUpgrade = async (paymentMethodId: string) => {
    if (!selectedTier) return;

    setIsLoading(true);
    try {
      await onUpgrade(selectedTier.id, paymentMethodId);
      toast.success(`Successfully upgraded to ${selectedTier.name}!`);
      onClose();
    } catch (error) {
      console.error("Upgrade failed:", error);
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatPurchase = async (paymentMethodId: string) => {
    if (!onPurchaseSeats) return;

    setIsLoading(true);
    try {
      await onPurchaseSeats(seatQuantity, paymentMethodId);
      toast.success(`Successfully purchased ${seatQuantity} additional seats!`);
      onClose();
    } catch (error) {
      console.error("Seat purchase failed:", error);
      toast.error("Seat purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getUpgradePrice = (tier: SubscriptionTier) => {
    const currentPrice = currentTier.price;
    const newPrice = tier.price;
    const priceDifference = newPrice - currentPrice;

    // Prorated price for remaining days in month
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const remainingDays = daysInMonth - now.getDate();
    const prorationFactor = remainingDays / daysInMonth;

    return Math.round(priceDifference * prorationFactor);
  };

  const getSeatPrice = () => {
    // Seats are 10% of base tier price
    return Math.round(currentTier.price * 0.1);
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case "starter":
        return <Zap className="w-5 h-5" />;
      case "growth":
        return <ArrowUp className="w-5 h-5" />;
      case "enterprise":
        return <Star className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (
      feature.toLowerCase().includes("user") ||
      feature.toLowerCase().includes("member")
    ) {
      return <Users className="w-4 h-4 text-green-500" />;
    }
    return <Check className="w-4 h-4 text-green-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            {upgradeMode === "tier"
              ? "Upgrade Subscription"
              : "Purchase Additional Seats"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === "selection" && (
            <>
              {/* Mode Selection */}
              <div className="flex space-x-4 mb-8">
                <button
                  onClick={() => setUpgradeMode("tier")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    upgradeMode === "tier"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <ArrowUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Upgrade Tier</h3>
                    <p className="text-sm text-gray-600">
                      Get more features and capabilities
                    </p>
                  </div>
                </button>

                {currentTier.id !== "enterprise" && (
                  <button
                    onClick={() => setUpgradeMode("seats")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      upgradeMode === "seats"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium text-gray-900">Add Seats</h3>
                      <p className="text-sm text-gray-600">
                        Expand your current plan
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Tier Upgrade Options */}
              {upgradeMode === "tier" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Plan: {currentTier.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTiers
                      .filter((tier) => tier.price > currentTier.price)
                      .map((tier) => (
                        <div
                          key={tier.id}
                          className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTier?.id === tier.id
                              ? "border-blue-500 bg-blue-50 shadow-lg"
                              : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                          }`}
                          onClick={() => setSelectedTier(tier)}
                        >
                          {tier.id === "enterprise" && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Most Popular
                              </span>
                            </div>
                          )}

                          <div className="text-center mb-4">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              {getTierIcon(tier.name)}
                              <h4 className="text-xl font-semibold text-gray-900">
                                {tier.name}
                              </h4>
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                              ${tier.price}
                              <span className="text-sm font-normal text-gray-600">
                                /month
                              </span>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Upgrade for ${getUpgradePrice(tier)} today
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            {tier.features.slice(0, 4).map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-2"
                              >
                                {getFeatureIcon(feature)}
                                <span className="text-sm text-gray-700">
                                  {feature}
                                </span>
                              </div>
                            ))}
                            {tier.features.length > 4 && (
                              <div className="text-sm text-gray-500">
                                +{tier.features.length - 4} more features
                              </div>
                            )}
                          </div>

                          {selectedTier?.id === tier.id && (
                            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                              <div className="absolute top-2 right-2">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Check className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Seat Purchase Options */}
              {upgradeMode === "seats" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add Seats to {currentTier.name} Plan
                  </h3>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">
                        Additional Seats
                      </span>
                      <span className="text-sm text-gray-600">
                        ${getSeatPrice()} per seat/month
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          setSeatQuantity(Math.max(1, seatQuantity - 1))
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="text-2xl font-semibold text-gray-900">
                        {seatQuantity}
                      </span>
                      <button
                        onClick={() => setSeatQuantity(seatQuantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Monthly Cost:</span>
                        <span className="font-semibold text-lg">
                          ${getSeatPrice() * seatQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("payment")}
                  disabled={
                    upgradeMode === "tier" ? !selectedTier : seatQuantity === 0
                  }
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Continue to Payment
                </button>
              </div>
            </>
          )}

          {step === "payment" && (
            <Elements stripe={stripePromise}>
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {upgradeMode === "tier"
                      ? "Complete Upgrade"
                      : "Complete Purchase"}
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    {upgradeMode === "tier" && selectedTier ? (
                      <>
                        <p className="text-sm text-blue-800">
                          Upgrading from <strong>{currentTier.name}</strong> to{" "}
                          <strong>{selectedTier.name}</strong>
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          You'll be charged ${getUpgradePrice(selectedTier)}{" "}
                          today for the remaining days in this billing cycle.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-blue-800">
                          Adding <strong>{seatQuantity} seats</strong> to your{" "}
                          {currentTier.name} plan
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Monthly cost: ${getSeatPrice() * seatQuantity}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <PaymentForm
                  onSubmit={
                    upgradeMode === "tier"
                      ? handleTierUpgrade
                      : handleSeatPurchase
                  }
                  isLoading={isLoading}
                  amount={
                    upgradeMode === "tier" && selectedTier
                      ? getUpgradePrice(selectedTier)
                      : getSeatPrice() * seatQuantity
                  }
                  description={
                    upgradeMode === "tier" && selectedTier
                      ? `Upgrade to ${selectedTier.name}`
                      : `${seatQuantity} Additional Seats`
                  }
                />

                <button
                  onClick={() => setStep("selection")}
                  className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to Selection
                </button>
              </div>
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};
