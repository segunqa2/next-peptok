const express = require("express");
const router = express.Router();

// Mock database connection (replace with your actual database service)
const db = {
  query: async (text, params) => {
    // Mock subscription tiers data based on your requirements
    if (text.includes("subscription_tiers")) {
      return {
        rows: [
          {
            id: "starter",
            name: "Starter Plan",
            slug: "starter",
            description:
              "Designed for small teams launching their mentorship journey",
            price_monthly: 99.0,
            price_annual: 1069.2,
            user_cap: 20,
            features: [
              "200 minutes of mentor time per month",
              "Minimum commitment: 2 users (add up to 20 extra seats at CA$119/user/month)",
              "Monthly progress reports",
              "Email support",
              "Basic metrics dashboard",
            ],
            metrics_included: [
              "Session completion rate",
              "Basic engagement metrics",
              "Monthly progress tracking",
            ],
            support_level: "basic",
            customizations_enabled: false,
            analytics_level: "basic",
            is_active: true,
            minimum_users: 2,
            extra_seat_price: 119.0,
          },
          {
            id: "growth",
            name: "Growth Plan",
            slug: "growth",
            description: "Ideal for expanding programs and scaling impact",
            price_monthly: 199.0,
            price_annual: 2148.4,
            user_cap: 100,
            features: [
              "1,200 minutes of mentor time per month",
              "Includes all Starter features",
              "Minimum commitment: 5 users (add up to 100 extra seats at CA$219/user/month)",
              "Advanced metrics and analytics",
              "Priority support",
            ],
            metrics_included: [
              "All Starter metrics",
              "Advanced progress analytics",
              "Team performance insights",
              "ROI tracking",
              "Department comparisons",
            ],
            support_level: "premium",
            customizations_enabled: true,
            analytics_level: "advanced",
            is_active: true,
            minimum_users: 5,
            extra_seat_price: 219.0,
            badge: "Best Value",
          },
          {
            id: "enterprise",
            name: "Enterprise Plan",
            slug: "enterprise",
            description:
              "Tailored for large organizations with complex requirements",
            price_monthly: 0,
            price_annual: 0,
            user_cap: 999999,
            features: [
              "Unlimited user seats",
              "Dedicated Customer Success Manager",
              "White-labeling and integration options",
              "SLA guarantees and priority SLAs",
              "Custom mentor vetting",
              "API access",
              "SSO integration",
            ],
            metrics_included: [
              "All Growth metrics",
              "Custom KPI tracking",
              "Predictive analytics",
              "Executive dashboards",
              "Benchmark comparisons",
              "Multi-department insights",
            ],
            support_level: "enterprise",
            customizations_enabled: true,
            analytics_level: "enterprise",
            is_active: true,
            minimum_users: 1,
            extra_seat_price: 0,
            custom_pricing: true,
          },
        ],
      };
    }
    return { rows: [] };
  },
};

// GET /api/subscriptions/tiers - Get all subscription tiers
router.get("/tiers", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        price_monthly,
        price_annual,
        user_cap,
        features,
        metrics_included,
        support_level,
        customizations_enabled,
        analytics_level,
        is_active
      FROM subscription_tiers 
      WHERE is_active = true 
      ORDER BY price_monthly ASC
    `);

    const tiers = result.rows.map((tier) => ({
      id: tier.id,
      name: tier.name,
      slug: tier.slug,
      description: tier.description,
      price: tier.price_monthly,
      priceAnnual: tier.price_annual,
      billingPeriod: "monthly",
      userCap: tier.user_cap,
      features: Array.isArray(tier.features)
        ? tier.features
        : JSON.parse(tier.features || "[]"),
      metricsIncluded: Array.isArray(tier.metrics_included)
        ? tier.metrics_included
        : JSON.parse(tier.metrics_included || "[]"),
      supportLevel: tier.support_level,
      customizations: tier.customizations_enabled,
      analytics: tier.analytics_level,
      isActive: tier.is_active,
      // Add custom fields for the new pricing structure
      minimumUsers:
        tier.slug === "starter" ? 2 : tier.slug === "growth" ? 5 : 1,
      extraSeatPrice:
        tier.slug === "starter" ? 119 : tier.slug === "growth" ? 219 : 0,
      customPricing: tier.slug === "enterprise",
      badge: tier.slug === "growth" ? "Best Value" : undefined,
    }));

    res.json(tiers);
  } catch (error) {
    console.error("Error fetching subscription tiers:", error);
    res.status(500).json({
      error: "Failed to fetch subscription tiers",
      message: error.message,
    });
  }
});

// GET /api/subscriptions/tiers/:id - Get specific subscription tier
router.get("/tiers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `
      SELECT 
        id,
        name,
        slug,
        description,
        price_monthly,
        price_annual,
        user_cap,
        features,
        metrics_included,
        support_level,
        customizations_enabled,
        analytics_level,
        is_active
      FROM subscription_tiers 
      WHERE (id = $1 OR slug = $1) AND is_active = true
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subscription tier not found" });
    }

    const tier = result.rows[0];
    const formattedTier = {
      id: tier.id,
      name: tier.name,
      slug: tier.slug,
      description: tier.description,
      price: tier.price_monthly,
      priceAnnual: tier.price_annual,
      billingPeriod: "monthly",
      userCap: tier.user_cap,
      features: Array.isArray(tier.features)
        ? tier.features
        : JSON.parse(tier.features || "[]"),
      metricsIncluded: Array.isArray(tier.metrics_included)
        ? tier.metrics_included
        : JSON.parse(tier.metrics_included || "[]"),
      supportLevel: tier.support_level,
      customizations: tier.customizations_enabled,
      analytics: tier.analytics_level,
      isActive: tier.is_active,
      minimumUsers:
        tier.slug === "starter" ? 2 : tier.slug === "growth" ? 5 : 1,
      extraSeatPrice:
        tier.slug === "starter" ? 119 : tier.slug === "growth" ? 219 : 0,
      customPricing: tier.slug === "enterprise",
      badge: tier.slug === "growth" ? "Best Value" : undefined,
    };

    res.json(formattedTier);
  } catch (error) {
    console.error("Error fetching subscription tier:", error);
    res.status(500).json({
      error: "Failed to fetch subscription tier",
      message: error.message,
    });
  }
});

module.exports = router;
