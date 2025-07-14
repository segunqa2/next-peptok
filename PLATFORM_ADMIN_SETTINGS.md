# Platform Admin Settings

This document describes the new Platform Security and Analytics Settings features added to the admin dashboard.

## Overview

The Platform Admin Dashboard now includes two new comprehensive settings sections:

1. **Platform Security** - Security settings and access controls
2. **Analytics Settings** - Configure analytics and reporting

Both settings sections feature:

- Cross-browser synchronization for all platform admins
- Real-time updates across browser sessions
- Comprehensive configuration options
- Audit logging and security events
- Cache invalidation when settings change

## Platform Security Settings

### Access

Navigate to `/admin/security-settings` or click "Platform Security" from the Platform Admin Dashboard.

### Features

#### Password Policy

- Minimum password length (6-128 characters)
- Character requirements (uppercase, lowercase, numbers, special characters)
- Password expiry settings (days)
- Password history tracking

#### Session Management

- Session timeout configuration (minutes)
- Maximum concurrent sessions per user
- Remember me duration
- Force logout on password change

#### Two-Factor Authentication

- Enable/disable 2FA requirement
- Available methods: Email, SMS, Authenticator apps

#### Access Control

- Login attempt limits and lockout duration
- Allowed email domains whitelist
- Blocked countries list
- Rate limiting for API requests

#### Compliance & Data Protection

- Audit log retention settings
- Data encryption toggle
- GDPR compliance mode

#### Security Events

- Real-time security event monitoring
- Event severity levels (low, medium, high, critical)
- Event resolution tracking
- Automatic alerts for high-severity events

### Cross-Browser Sync

- All security settings synchronize across browsers within 5 seconds
- Changes made by any platform admin are visible to others
- Automatic conflict resolution using timestamps

## Analytics Settings

### Access

Navigate to `/admin/analytics-settings` or click "Analytics Settings" from the Platform Admin Dashboard.

### Features

#### Data Collection

- User tracking toggle
- Session tracking toggle
- Performance monitoring
- Error tracking
- Custom events

#### Data Retention

- Raw data retention (1-3650 days)
- Aggregated data retention (1-3650 days)
- Log data retention (1-365 days)

#### Privacy & Compliance

- User data anonymization
- Do Not Track respect
- GDPR mode
- Data processing consent requirements

#### Reporting Configuration

- Default timezone settings
- Default date ranges
- Auto-refresh intervals
- Real-time updates toggle

#### Enabled Metrics

Interactive selection of metrics to track:

- User registrations
- Session duration
- Page views
- Conversion rate
- Revenue tracking
- Error rates
- Bounce rates
- User engagement
- API calls
- Load times
- Active users
- Churn rates

#### Reports & Exports

- Scheduled report management
- Multiple export formats (CSV, JSON, PDF)
- Custom report generation
- Email distribution lists

#### Webhook Integration

- Webhook endpoint management
- Event subscriptions
- Test webhook functionality
- Security with webhook secrets

#### Alerts & Notifications

- Alert threshold configuration
- Multiple notification channels
- Severity-based alerting
- Real-time threshold monitoring

### Cross-Browser Sync

- Analytics settings synchronize across all platform admin sessions
- Real-time updates when any admin makes changes
- Automatic cache invalidation for related data

## Technical Implementation

### Services Created

1. **SecurityService** (`src/services/securityService.ts`)

   - Centralized security policy management
   - Password validation
   - Session management
   - Audit logging
   - Security event tracking

2. **AnalyticsService** (`src/services/analyticsService.ts`)
   - Analytics configuration management
   - Data collection controls
   - Report generation
   - Webhook management
   - Metric tracking

### API Integration

Enhanced `apiEnhanced.ts` with new endpoints:

- `getSecuritySettings()` / `updateSecuritySettings()`
- `getAnalyticsSettings()` / `updateAnalyticsSettings()`
- `getSecurityEvents()` / `resolveSecurityEvent()`
- `generateAnalyticsReport()` / `testWebhook()`

### Cross-Browser Synchronization

Added new sync configurations:

- `SECURITY_SETTINGS` - Security settings sync
- `ANALYTICS_SETTINGS` - Analytics settings sync

### Cache Invalidation

Enhanced cache invalidation to handle security and analytics data:

- Automatic cache clearing when settings change
- Platform-wide invalidation for security/analytics updates
- Cross-browser cache invalidation events

### Routing

Added protected routes:

- `/admin/security-settings` - Platform Security page
- `/admin/analytics-settings` - Analytics Settings page

Both routes require `platform_admin` user type for access.

## Usage Examples

### Security Configuration

1. Navigate to Platform Admin Dashboard
2. Click "Platform Security" card
3. Configure password policies, session settings, etc.
4. Click "Save Changes"
5. Settings automatically sync to all other platform admin browsers

### Analytics Configuration

1. Navigate to Platform Admin Dashboard
2. Click "Analytics Settings" card
3. Enable desired metrics and configure data retention
4. Set up webhooks and alerts as needed
5. Click "Save Changes"
6. Configuration applies platform-wide immediately

### Security Monitoring

1. Access Security Settings page
2. Click "Security Events" button
3. View real-time security events
4. Resolve events as needed
5. Monitor security metrics and trends

### Analytics Reporting

1. Access Analytics Settings page
2. Click "Reports" button to view scheduled reports
3. Generate on-demand reports
4. Configure webhook endpoints for real-time data
5. Set up alert thresholds for key metrics

## Security Considerations

- All sensitive data is encrypted when `enableDataEncryption` is enabled
- Security events are automatically logged for audit trails
- Cross-browser sync uses secure storage mechanisms
- Rate limiting prevents abuse of API endpoints
- GDPR compliance mode ensures data protection requirements

## Future Enhancements

1. **Advanced Security Features**

   - IP whitelisting/blacklisting
   - Advanced threat detection
   - Intrusion detection system
   - Security scoring dashboard

2. **Enhanced Analytics**

   - Machine learning insights
   - Predictive analytics
   - Custom dashboard builder
   - Advanced visualization options

3. **Integration Options**
   - SIEM system integration
   - External analytics platforms
   - Single sign-on (SSO) support
   - Third-party security tools

## Support

For technical support or questions about these features:

1. Check the audit logs for detailed change history
2. Review security events for any issues
3. Test webhook endpoints to ensure proper integration
4. Monitor cache invalidation logs for sync issues

All settings are automatically backed up and can be restored from the platform audit trail.
