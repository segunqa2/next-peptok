# Authorization, Real Data & Analytics Implementation

## Overview

This implementation adds comprehensive **role-based authorization**, **real data loading**, and **analytics tracking** throughout the platform. The system now ensures users only see data they're authorized to access and tracks all interactions for insights.

## 🔐 Authorization System

### Role-Based Access Control

#### **Platform Admin** (`platform_admin`)

- **Full Access**: Can view all users, companies, platform statistics
- **Admin Functions**: User management, company oversight, system configuration
- **Analytics**: Platform-wide metrics and insights
- **Authorization**: Unrestricted access to all data and functions

#### **Company Admin** (`company_admin`)

- **Company Data**: Only their company's requests, employees, analytics
- **Request Management**: Create/manage mentorship requests for their company
- **Analytics**: Company-specific metrics and employee engagement data
- **Authorization**: Restricted to own company resources (`companyId` filtering)

#### **Coach** (`coach`)

- **Match Visibility**: Only see mentorship requests assigned to them or pending matches they can accept
- **Accept/Decline**: Can accept or decline their specific matches
- **Analytics**: Personal performance metrics, earnings, ratings
- **Authorization**: Restricted to own data and relevant matches only

### Authorization Implementation

```typescript
// Authorization helper checks user permissions
const checkAuthorization = (
  requiredRoles?: string[],
  resourceOwnerId?: string,
) => {
  if (!currentUser) throw new Error("Authentication required");

  if (requiredRoles && !requiredRoles.includes(currentUser.userType)) {
    throw new Error("Insufficient permissions");
  }

  // Resource owner check - users can only access their own data
  if (resourceOwnerId && currentUser.userType !== "platform_admin") {
    if (
      currentUser.id !== resourceOwnerId &&
      currentUser.companyId !== resourceOwnerId
    ) {
      throw new Error("Access denied - you can only access your own resources");
    }
  }

  return currentUser;
};
```

## 📊 Real Data Loading

### Enhanced API Service

**File**: `src/services/apiEnhanced.ts`

The new API service replaces mock data with real data loading, complete with:

- **Role-based filtering** at the API level
- **Authorization checks** before each request
- **Fallback to localStorage** when backend unavailable
- **Comprehensive error handling** and analytics tracking

### Key Methods

#### For Coaches:

- `getCoachMatches(coachId)` - Get matches for specific coach only
- `acceptMatch(matchId)` - Accept a mentorship match
- `declineMatch(matchId, reason)` - Decline with optional reason
- `updateCoachAvailability(availability)` - Manage availability

#### For Company Admins:

- `getCompanyRequests(companyId)` - Get requests for specific company only
- `createMentorshipRequest(request)` - Create new company request
- `getAnalyticsData(query)` - Company-specific analytics

#### For Platform Admins:

- `getPlatformStats()` - Platform-wide statistics
- `getAllUsers(filters)` - All users with filtering options
- `getAllCompanies()` - All companies data

### Data Privacy

- **Coaches**: Can only see their assigned matches + pending matches they can accept
- **Company Admins**: Can only see their company's data (employees, requests, analytics)
- **Platform Admins**: Can see all data across the platform

## 📈 Analytics System

### Comprehensive Analytics Service

**File**: `src/services/analytics.ts`

Features:

- **Event Tracking**: User actions, page views, business events
- **Performance Monitoring**: API response times, page load times
- **Error Tracking**: Automatic error capture with context
- **Role-specific Analytics**: Different metrics for each user type

### Analytics Dashboard

**File**: `src/components/analytics/AnalyticsDashboard.tsx`

**Platform Admin Analytics:**

- Total users, companies, coaches
- Revenue tracking
- User registration trends
- Session completion rates
- Platform growth metrics

**Company Admin Analytics:**

- Employee engagement rates
- Program completion rates
- ROI calculations
- Team performance metrics
- Cost analysis

**Coach Analytics:**

- Session completion rates
- Client ratings and feedback
- Earnings tracking
- Profile view statistics
- Match acceptance rates

### Event Tracking Examples

```typescript
// User actions
analytics.trackAction({
  action: "match_accepted",
  component: "coach_dashboard",
  metadata: { matchId, coachId },
});

// Business events
analytics.coach.matchAccepted(matchId, coachId);
analytics.company.requestCreated(requestId, companyId, requestType);
analytics.platform.userRegistered(userId, userType, source);

// Performance tracking
analytics.trackPerformance("api_request", responseTime, {
  endpoint: "/coaches/matches",
  method: "GET",
});
```

## 🔄 Updated Components

### Coach Dashboard (`src/pages/coach/CoachDashboard.tsx`)

- **Real Data**: Loads coach-specific matches from API
- **Authorization**: Only shows coach's own data
- **Analytics**: Tracks all coach interactions
- **Accept/Decline**: Uses new API with proper authorization

### Platform Admin Dashboard (`src/pages/PlatformAdminDashboard.tsx`)

- **Real Data**: Loads platform statistics, users, companies
- **Authorization**: Platform admin access required
- **Analytics**: Tracks admin actions (user suspension, etc.)
- **User Management**: Real user operations with tracking

### Enhanced Company Dashboard (`src/pages/CompanyDashboardEnhanced.tsx`)

- **Real Data**: Company-specific requests and metrics
- **Authorization**: Company-scoped data only
- **Analytics**: Integrated analytics dashboard
- **ROI Tracking**: Business impact measurements

### Authentication Context (`src/contexts/AuthContext.tsx`)

- **API Integration**: Sets current user in API service
- **Analytics**: Initializes user tracking on login
- **Session Management**: Proper cleanup on logout

## 🚀 Key Features

### 1. Role-Based Data Filtering

- Each API call includes user context
- Automatic filtering based on user role
- No unauthorized data exposure

### 2. Real-Time Analytics

- Every user interaction tracked
- Performance monitoring
- Error tracking with context
- Business metric calculation

### 3. Authorization Enforcement

- API-level authorization checks
- Component-level access control
- Resource ownership validation
- Comprehensive error handling

### 4. Data Privacy

- Users only see their own data
- Company admins see company-scoped data
- Platform admins have full access
- No data leakage between organizations

## 📱 User Experience

### For Coaches:

1. **Login** → See only relevant matches
2. **Dashboard** → Personal performance metrics
3. **Matches** → Accept/decline with real API calls
4. **Analytics** → Earnings, ratings, session stats

### For Company Admins:

1. **Login** → Company dashboard with real data
2. **Requests** → Create and manage company requests
3. **Analytics** → Team engagement and ROI metrics
4. **Employee Management** → Company-scoped user data

### For Platform Admins:

1. **Login** → Full platform overview
2. **User Management** → Real user operations
3. **Analytics** → Platform-wide insights
4. **System Configuration** → Administrative controls

## 🔧 Technical Implementation

### API Architecture

- **Enhanced API Service**: Role-based data access
- **Authorization Middleware**: Permission checking
- **Real Data Integration**: Actual API calls with fallbacks
- **Error Handling**: Comprehensive error tracking

### Analytics Architecture

- **Event Collection**: All user interactions
- **Data Processing**: Real-time metric calculation
- **Privacy Compliance**: Role-based analytics access
- **Performance Monitoring**: System health tracking

### Security Features

- **Authentication Required**: All protected routes
- **Role Validation**: Permission-based access
- **Resource Ownership**: Data access controls
- **Error Logging**: Security event tracking

## 🎯 Benefits

1. **Security**: Proper authorization prevents unauthorized access
2. **Analytics**: Comprehensive insights for all user types
3. **Performance**: Real data loading with fallbacks
4. **Scalability**: Role-based architecture supports growth
5. **Compliance**: Data privacy and access controls
6. **User Experience**: Personalized, relevant data display

## 📊 Routes Updated

- `/platform-admin` - Platform admin dashboard with real data
- `/coach/dashboard` - Coach dashboard with authorized matches
- `/company/dashboard` - Enhanced company dashboard
- `/analytics` - Role-based analytics dashboard
- All protected routes now enforce proper authorization

This implementation provides a production-ready foundation for role-based access control, real data management, and comprehensive analytics tracking across the entire platform.
