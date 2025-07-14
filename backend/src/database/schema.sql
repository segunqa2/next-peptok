-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_type AS ENUM ('enterprise', 'coach', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE oauth_provider AS ENUM ('google', 'microsoft', 'email');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled', 'expired');
CREATE TYPE mentorship_request_status AS ENUM ('draft', 'submitted', 'matched', 'active', 'completed', 'cancelled');
CREATE TYPE team_member_status AS ENUM ('invited', 'accepted', 'declined', 'removed');
CREATE TYPE team_member_role AS ENUM ('participant', 'observer', 'admin');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE goal_category AS ENUM ('leadership', 'technical', 'business', 'personal');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'coach');

-- Users table (central user management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type user_type NOT NULL,
    status user_status DEFAULT 'pending_verification',
    oauth_provider oauth_provider DEFAULT 'email',
    oauth_id VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_oauth_provider_id UNIQUE (oauth_provider, oauth_id)
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription tiers table
CREATE TABLE subscription_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2),
    user_cap INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    metrics_included JSONB DEFAULT '[]',
    support_level VARCHAR(50) DEFAULT 'basic',
    customizations_enabled BOOLEAN DEFAULT false,
    analytics_level VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company subscriptions table
CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
    status subscription_status DEFAULT 'trial',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end TIMESTAMP WITH TIME ZONE,
    billing_email VARCHAR(255),
    payment_method JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company users (enterprises/admins)
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    role VARCHAR(50) DEFAULT 'enterprise',
    title VARCHAR(255),
    department VARCHAR(100),
    manager_id UUID REFERENCES company_users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
);

-- Coach profiles
CREATE TABLE coach_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    experience_years INTEGER,
    rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    coaching_areas JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    availability JSONB DEFAULT '{}',
    languages JSONB DEFAULT '["English"]',
    location VARCHAR(255),
    response_time VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_coach_user UNIQUE (user_id)
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User skills (for both coaches and enterprises)
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level skill_level DEFAULT 'beginner',
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_id)
);

-- Mentorship requests
CREATE TABLE mentorship_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status mentorship_request_status DEFAULT 'draft',
    preferred_coaching JSONB DEFAULT '[]',
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    session_frequency VARCHAR(50),
    metrics_to_track JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship goals
CREATE TABLE mentorship_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category goal_category DEFAULT 'business',
    priority goal_priority DEFAULT 'medium',
    target_metrics JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team members for mentorship requests
CREATE TABLE mentorship_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role team_member_role DEFAULT 'participant',
    status team_member_status DEFAULT 'invited',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_request_member UNIQUE (request_id, email)
);

-- Mentorship connections (coach-enterprise relationships)
CREATE TABLE mentorship_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES mentorship_requests(id),
    coach_id UUID NOT NULL REFERENCES users(id),
    enterprise_id UUID NOT NULL REFERENCES users(id),
    status connection_status DEFAULT 'pending',
    goals JSONB DEFAULT '[]',
    progress INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_coach_enterprise UNIQUE (coach_id, enterprise_id)
);

-- Mentorship sessions
CREATE TABLE mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES mentorship_connections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status session_status DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    notes TEXT,
    rating DECIMAL(3,2),
    feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Metrics definitions
CREATE TABLE metric_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    formula TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company metrics (tracked values)
CREATE TABLE company_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES metric_definitions(id),
    current_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    measurement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_company_metric_date UNIQUE (company_id, metric_id, measurement_date)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_coach_profiles_rating ON coach_profiles(rating DESC);
CREATE INDEX idx_coach_profiles_available ON coach_profiles(is_available);
-- Connections and sessions indexes
CREATE INDEX idx_mentorship_connections_coach ON mentorship_connections(coach_id);
CREATE INDEX idx_mentorship_connections_enterprise ON mentorship_connections(enterprise_id);
CREATE INDEX idx_mentorship_connections_employee ON mentorship_connections(employee_id);
CREATE INDEX idx_mentorship_sessions_connection ON mentorship_sessions(connection_id);
CREATE INDEX idx_mentorship_sessions_scheduled ON mentorship_sessions(scheduled_at);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON mentorship_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_connections_updated_at BEFORE UPDATE ON mentorship_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_sessions_updated_at BEFORE UPDATE ON mentorship_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
