-- Insert updated subscription tiers with Canadian pricing
-- Clear existing data
DELETE FROM subscription_tiers;

-- Insert new pricing tiers
INSERT INTO subscription_tiers (
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
) VALUES 
-- Starter Plan
(
    uuid_generate_v4(),
    'Starter Plan',
    'starter',
    'Designed for small teams launching their mentorship journey',
    99.00,
    1069.20, -- 99 * 12 * 0.9 (10% discount for annual)
    20,
    '["200 minutes of mentor time per month", "Minimum commitment: 2 users (add up to 20 extra seats at CA$119/user/month)", "Monthly progress reports", "Email support", "Basic metrics dashboard"]',
    '["Session completion rate", "Basic engagement metrics", "Monthly progress tracking"]',
    'basic',
    false,
    'basic',
    true
),
-- Growth Plan
(
    uuid_generate_v4(),
    'Growth Plan',
    'growth', 
    'Ideal for expanding programs and scaling impact',
    199.00,
    2148.40, -- 199 * 12 * 0.9 (10% discount for annual)
    100,
    '["1,200 minutes of mentor time per month", "Includes all Starter features", "Minimum commitment: 5 users (add up to 100 extra seats at CA$219/user/month)", "Advanced metrics and analytics", "Priority support"]',
    '["All Starter metrics", "Advanced progress analytics", "Team performance insights", "ROI tracking", "Department comparisons"]',
    'premium',
    true,
    'advanced',
    true
),
-- Enterprise Plan
(
    uuid_generate_v4(),
    'Enterprise Plan',
    'enterprise',
    'Tailored for large organizations with complex requirements',
    0.00, -- Custom pricing
    0.00,
    999999,
    '["Unlimited user seats", "Dedicated Customer Success Manager", "White-labeling and integration options", "SLA guarantees and priority SLAs", "Custom mentor vetting", "API access", "SSO integration"]',
    '["All Growth metrics", "Custom KPI tracking", "Predictive analytics", "Executive dashboards", "Benchmark comparisons", "Multi-department insights"]',
    'enterprise',
    true,
    'enterprise',
    true
);
