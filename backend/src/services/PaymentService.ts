import Stripe from "stripe";
import { logger } from "../config/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_example", {
  apiVersion: "2024-06-20",
});

export interface SubscriptionTier {
  id: string;
  name: string;
  priceId: string;
  userCap: number;
  price: number;
  currency: string;
  features: string[];
  metricsIncluded: string[];
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface SubscriptionUpgrade {
  currentTier: string;
  newTier: string;
  prorationAmount: number;
  effectiveDate: Date;
}

export interface AdditionalSeats {
  quantity: number;
  pricePerSeat: number;
  totalAmount: number;
}

export class PaymentService {
  private subscriptionTiers: Map<string, SubscriptionTier> = new Map();

  constructor() {
    this.initializeSubscriptionTiers();
  }

  private initializeSubscriptionTiers(): void {
    const tiers: SubscriptionTier[] = [
      {
        id: "starter",
        name: "Starter",
        priceId: "price_starter", // Stripe price ID
        userCap: 10,
        price: 49,
        currency: "USD",
        features: [
          "Up to 10 team members",
          "Basic mentorship matching",
          "2 concurrent sessions",
          "Email support",
          "Session recordings",
        ],
        metricsIncluded: [
          "Session completion rate",
          "Basic engagement metrics",
          "Progress tracking",
        ],
      },
      {
        id: "growth",
        name: "Growth",
        priceId: "price_growth",
        userCap: 50,
        price: 99,
        currency: "USD",
        features: [
          "Up to 50 team members",
          "AI-powered mentor matching",
          "10 concurrent sessions",
          "Priority support",
          "Advanced analytics",
          "Session recordings & transcripts",
          "Custom goal tracking",
        ],
        metricsIncluded: [
          "Session completion rate",
          "Advanced engagement metrics",
          "Progress tracking",
          "Performance analytics",
          "Team collaboration metrics",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        priceId: "price_enterprise",
        userCap: -1, // Unlimited
        price: 299,
        currency: "USD",
        features: [
          "Unlimited team members",
          "AI-powered mentor matching",
          "Unlimited concurrent sessions",
          "Dedicated support",
          "Custom integrations",
          "Advanced analytics & reporting",
          "Session recordings & transcripts",
          "Custom goal tracking",
          "White-label options",
          "API access",
        ],
        metricsIncluded: [
          "All metrics included",
          "Custom metric creation",
          "Advanced reporting",
          "ROI tracking",
          "Department analytics",
        ],
      },
    ];

    tiers.forEach((tier) => this.subscriptionTiers.set(tier.id, tier));
    logger.info(`Initialized ${tiers.length} subscription tiers`);
  }

  public async createPaymentIntent(
    amount: number,
    currency: string = "USD",
    metadata: Record<string, string> = {},
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe expects cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(
        `Created payment intent ${paymentIntent.id} for ${amount} ${currency}`,
      );

      return {
        id: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      logger.error("Failed to create payment intent:", error);
      throw new Error("Failed to create payment intent");
    }
  }

  public async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      logger.info(
        `Created subscription ${subscription.id} for customer ${customerId}`,
      );
      return subscription;
    } catch (error) {
      logger.error("Failed to create subscription:", error);
      throw new Error("Failed to create subscription");
    }
  }

  public async createCustomer(
    email: string,
    name?: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      logger.info(`Created Stripe customer ${customer.id} for ${email}`);
      return customer;
    } catch (error) {
      logger.error("Failed to create customer:", error);
      throw new Error("Failed to create customer");
    }
  }

  public async upgradeSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<SubscriptionUpgrade> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentItem = subscription.items.data[0];

      const currentTier = this.findTierByPriceId(currentItem.price.id);
      const newTier = this.findTierByPriceId(newPriceId);

      if (!currentTier || !newTier) {
        throw new Error("Invalid subscription tier");
      }

      // Calculate proration
      const now = Math.floor(Date.now() / 1000);
      const periodEnd = subscription.current_period_end;
      const remainingTime = periodEnd - now;
      const totalPeriodTime =
        subscription.current_period_end - subscription.current_period_start;
      const prorationFactor = remainingTime / totalPeriodTime;

      const currentTierPrice = currentTier.price;
      const newTierPrice = newTier.price;
      const priceDifference = newTierPrice - currentTierPrice;
      const prorationAmount = Math.round(priceDifference * prorationFactor);

      // Update subscription
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: currentItem.id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      });

      logger.info(
        `Upgraded subscription ${subscriptionId} from ${currentTier.name} to ${newTier.name}`,
      );

      return {
        currentTier: currentTier.id,
        newTier: newTier.id,
        prorationAmount,
        effectiveDate: new Date(),
      };
    } catch (error) {
      logger.error("Failed to upgrade subscription:", error);
      throw new Error("Failed to upgrade subscription");
    }
  }

  public async purchaseAdditionalSeats(
    companyId: string,
    quantity: number,
    currentTierId: string,
  ): Promise<AdditionalSeats> {
    try {
      const tier = this.subscriptionTiers.get(currentTierId);
      if (!tier) {
        throw new Error("Invalid subscription tier");
      }

      // Calculate price per additional seat (10% of base tier price)
      const pricePerSeat = Math.round(tier.price * 0.1);
      const totalAmount = pricePerSeat * quantity;

      // Create one-time payment for additional seats
      const paymentIntent = await this.createPaymentIntent(totalAmount, "USD", {
        type: "additional_seats",
        company_id: companyId,
        quantity: quantity.toString(),
        tier_id: currentTierId,
      });

      logger.info(
        `Created payment for ${quantity} additional seats for company ${companyId}`,
      );

      return {
        quantity,
        pricePerSeat,
        totalAmount,
      };
    } catch (error) {
      logger.error("Failed to purchase additional seats:", error);
      throw new Error("Failed to purchase additional seats");
    }
  }

  public async handleWebhook(
    payload: string,
    signature: string,
    endpointSecret: string,
  ): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );

      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case "subscription.created":
        case "subscription.updated":
          await this.handleSubscriptionUpdate(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "subscription.deleted":
          await this.handleSubscriptionCanceled(
            event.data.object as Stripe.Subscription,
          );
          break;
        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error("Webhook handling failed:", error);
      throw new Error("Webhook handling failed");
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    logger.info(`Payment succeeded: ${paymentIntent.id}`);
    // Here you would update your database with the successful payment
    // For example, activate subscription, add seats, etc.
  }

  private async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info(`Subscription updated: ${subscription.id}`);
    // Update subscription status in your database
  }

  private async handleSubscriptionCanceled(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info(`Subscription canceled: ${subscription.id}`);
    // Handle subscription cancellation in your database
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.error(`Payment failed for invoice: ${invoice.id}`);
    // Handle failed payment (send notification, suspend account, etc.)
  }

  private findTierByPriceId(priceId: string): SubscriptionTier | undefined {
    return Array.from(this.subscriptionTiers.values()).find(
      (tier) => tier.priceId === priceId,
    );
  }

  public getSubscriptionTiers(): SubscriptionTier[] {
    return Array.from(this.subscriptionTiers.values());
  }

  public getSubscriptionTier(tierId: string): SubscriptionTier | undefined {
    return this.subscriptionTiers.get(tierId);
  }

  public async getUsageStats(customerId: string): Promise<any> {
    try {
      // Get customer's current subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      const usage = await stripe.subscriptionItems.listUsageRecords(
        subscription.items.data[0].id,
      );

      return {
        subscription,
        usage: usage.data,
      };
    } catch (error) {
      logger.error("Failed to get usage stats:", error);
      return null;
    }
  }

  public calculateUpgradeCost(
    currentTierId: string,
    newTierId: string,
    remainingDays: number,
  ): number {
    const currentTier = this.subscriptionTiers.get(currentTierId);
    const newTier = this.subscriptionTiers.get(newTierId);

    if (!currentTier || !newTier) {
      throw new Error("Invalid tier IDs");
    }

    const dailyDifference = (newTier.price - currentTier.price) / 30;
    return Math.round(dailyDifference * remainingDays);
  }
}

export const paymentService = new PaymentService();
