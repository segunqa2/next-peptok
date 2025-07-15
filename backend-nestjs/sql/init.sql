-- PostgreSQL initialization script for Peptok platform
-- This script sets up the initial database structure and basic configuration

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types for better data consistency
DO $$ 
BEGIN
    -- User types enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM (
            'platform_admin',
            'company_admin', 
            'coach',
            'team_member'
        );
    END IF;

    -- Company status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status_enum') THEN
        CREATE TYPE company_status_enum AS ENUM (
            'active',
            'inactive',
            'suspended',
            'trial'
        );
    END IF;

    -- Subscription tier enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_enum') THEN
        CREATE TYPE subscription_tier_enum AS ENUM (
            'starter',
            'growth', 
            'enterprise'
        );
    END IF;

    -- Session status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status_enum') THEN
        CREATE TYPE session_status_enum AS ENUM (
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        );
    END IF;

    -- Matching request status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'matching_request_status_enum') THEN
        CREATE TYPE matching_request_status_enum AS ENUM (
            'pending',
            'processing',
            'matched',
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- Create indexes for better performance (will be created after tables are set up by TypeORM)

-- Log the initialization
INSERT INTO information_schema.sql_features (feature_id, feature_name, sub_feature_id, sub_feature_name, is_supported, comments)
VALUES ('PEPTOK_001', 'Peptok Platform Initialized', '001', 'Database Setup Complete', 'YES', 'PostgreSQL database initialized successfully')
ON CONFLICT DO NOTHING;

-- Display completion message
SELECT 'Peptok PostgreSQL database initialized successfully!' as status;
