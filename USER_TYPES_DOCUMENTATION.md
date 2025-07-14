# User Types & Access Control

## 🎯 3 User Types Implemented

### 1. **Platform Admin** (`platform_admin`)

**Role**: Overall platform administrators who manage the entire Peptok platform

**Access & Permissions**:

- ✅ **Full Platform Management**: Can access platform-wide settings and configurations
- ✅ **Session Creation**: Can create and manage coaching sessions
- ✅ **Cost Management**: See platform earnings, service charges, and commissions
- ✅ **User Management**: Manage companies and coaches across the platform
- ✅ **Dashboard**: `/platform-admin` - Platform-wide analytics and controls
- ✅ **Badge**: "Platform Admin" with shield icon

**Demo Account**: `demo@platform.com` (any password)

### 2. **Company/SME Admin** (`company_admin`)

**Role**: Company administrators who manage their organization's mentorship programs

**Access & Permissions**:

- ✅ **Company Management**: Manage their company's mentorship programs and employees
- ✅ **Session Creation**: Can create coaching sessions for their team
- ✅ **Mentor Matching**: Find and match coaches for employees
- ✅ **Program Creation**: Access to "Create New Program" functionality
- ✅ **Dashboard**: `/dashboard` - Company-specific analytics and management
- ✅ **Badge**: "Company Admin" with users icon

**Demo Account**: `demo@company.com` (any password)

### 3. **Coaches** (`coach`)

**Role**: Individual coaches/mentors who provide services

**Access & Permissions**:

- ✅ **Coach Dashboard**: `/coach/dashboard` - Personal coaching analytics
- ✅ **Session Management**: View and manage their coaching sessions
- ✅ **Profile Management**: Update availability, rates, and expertise
- ❌ **Cannot Create Sessions**: Sessions are created by admin users
- ❌ **Cannot Access Company Features**: Limited to coaching-specific features
- ✅ **Badge**: "Coach" with outline styling

**Demo Account**: `demo@coach.com` (any password)

## 🔐 Access Control Matrix

| Feature            | Platform Admin | Company Admin | Coach |
| ------------------ | -------------- | ------------- | ----- |
| Platform Dashboard | ✅             | ❌            | ❌    |
| Company Dashboard  | ✅             | ✅            | ❌    |
| Coach Dashboard    | ❌             | ❌            | ✅    |
| Create Sessions    | ✅             | ✅            | ❌    |
| View Session Costs | ✅             | ✅            | ❌    |
| Create Programs    | ✅             | ✅            | ❌    |
| Mentor Matching    | ✅             | ✅            | ❌    |
| Coach Directory    | ✅             | ✅            | ❌    |
| Profile Management | ✅             | ✅            | ✅    |
| Connections        | ✅             | ✅            | ✅    |

## 🚀 Authentication Flow

### Login Routing

- **Platform Admin** → `/platform-admin`
- **Company Admin** → `/dashboard`
- **Coach** → `/coach/dashboard`

### Signup Options

- **Company Admin**: For businesses wanting to create mentorship programs
- **Coach**: For mentors/coaches wanting to join the platform
- **Platform Admin**: Created by existing platform admins (not public signup)

## 🎨 Visual Indicators

### Header Badges

- **Platform Admin**: Secondary badge with shield icon - "Platform Admin"
- **Company Admin**: Default badge with users icon - "Company Admin"
- **Coach**: Outline badge - "Coach"

### Navigation

- **Platform Admin**: "Platform Dashboard", "Mentors", "Connections"
- **Company Admin**: "Dashboard", "Mentors", "Connections"
- **Coach**: "Dashboard", "Connections"

## 🔧 Implementation Details

### User Type Values

```typescript
type UserType = "platform_admin" | "company_admin" | "coach";
```

### Protected Routes

```typescript
// Session creation - Admin users only
allowedRoles: ["platform_admin", "company_admin"];

// Platform management - Platform admin only
requiredUserType: "platform_admin";

// Company management - Company admin only
requiredUserType: "company_admin";

// Coach features - Coach only
requiredUserType: "coach";
```

### Demo Accounts

| User Type      | Email               | Password | Access           |
| -------------- | ------------------- | -------- | ---------------- |
| Platform Admin | `demo@platform.com` | any      | Full platform    |
| Company Admin  | `demo@company.com`  | any      | Company features |
| Coach          | `demo@coach.com`    | any      | Coach features   |

## ✅ Validation Complete

The system now properly implements the 3 required user types with:

1. **Clear Role Separation**: Each user type has distinct permissions and access
2. **Proper Access Control**: Protected routes enforce user type requirements
3. **Visual Differentiation**: Clear badges and navigation for each user type
4. **Functional Restrictions**: Coaches cannot create sessions, only admins can
5. **Dashboard Routing**: Each user type routes to appropriate dashboard
6. **Demo Accounts**: Test accounts for all 3 user types

The platform now correctly enforces the 3-tier user hierarchy as requested.
