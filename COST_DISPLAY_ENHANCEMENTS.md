# Enhanced Cost Display and Data Separation Implementation

## Overview

Enhanced the platform's matched coaches cost display and improved company data separation to show detailed program costs, session costs, and hourly rates with proper authorization controls.

## Key Enhancements

### 1. Detailed Cost Breakdown in Matched Coaches List

**Location**: `src/pages/mentorship/MentorshipRequestDetails.tsx`

**Features**:

- **Hourly Rate**: Clear display of coach's hourly rate
- **Session Cost**: Cost per individual session (hourly rate × hours per session)
- **Total Sessions**: Number of sessions in the program
- **Program Cost**: Base cost for all sessions (session cost × total sessions)
- **Additional Participants**: Cost for extra team members beyond the first
- **Service Fee**: Platform service fee with percentage display
- **Total Program Cost**: Complete program cost including all fees
- **Average Cost Per Session**: Program cost divided by number of sessions

**Before**:

```
Coach Rate: $250/hr
Service Fee: 10%
Total: $5,100.00 USD
```

**After**:

```
Session Cost: $500/session
Total Sessions: 12
Program Cost: $6,000.00
Additional Participants: $600.00
Service Fee (10%): $660.00
Total Program: $7,260.00 USD
$605.00/session average
```

### 2. Enhanced Demo Database Structure

**Location**: `src/data/demoDatabase.ts`

**Improvements**:

- Added detailed timeline structure with:
  - `startDate` and `endDate` for precise duration calculation
  - `sessionFrequency` (weekly, bi-weekly, monthly)
  - `hoursPerSession` for accurate session costing
  - `totalSessions` for program planning
- Enhanced team member structure with roles and contact information
- Maintains backward compatibility with old timeline format

### 3. Company Data Separation Enhancement

**Location**: `src/services/apiEnhanced.ts`

**New Method**: `getCompanyCoaches(companyId?: string)`

- Company admins can only view coaches for their own company
- Filters coaches based on company's active requests and assignments
- Tracks analytics for company coach viewing
- Returns coaches with their assigned requests and availability

**Authorization Controls**:

- Company admins restricted to their own company data
- Platform admins have full access
- Proper error handling for unauthorized access attempts

### 4. Flexible Cost Calculation

**Features**:

- Handles both old string-based timeline format and new detailed structure
- Automatically calculates costs based on available timeline data
- Fallback calculations for legacy requests
- Supports different session frequencies and durations

## Cost Calculation Formula

```javascript
sessionCost = hourlyRate × hoursPerSession
baseSessionsCost = sessionCost × totalSessions
additionalParticipantsCost = (teamMembers - 1) × additionalParticipantFee × totalSessions
subtotal = baseSessionsCost + additionalParticipantsCost
serviceFee = subtotal × serviceFeePct
totalProgramCost = subtotal + serviceFee
avgCostPerSession = totalProgramCost / totalSessions
```

## Demo Data Structure Examples

### Leadership Development Program (TechCorp)

- **Duration**: 3 months (12 weekly sessions)
- **Session Length**: 2 hours each
- **Participants**: 8 team members
- **Coach**: Dr. Emily Harrison at $250/hr
- **Calculated Costs**:
  - Session Cost: $500
  - Program Cost: $6,000
  - Additional Participants: $700 (7 × $25 × 12)
  - Service Fee: $670 (10%)
  - **Total**: $7,370

### Communication Workshop (StartupCo)

- **Duration**: 6 weeks (6 weekly sessions)
- **Session Length**: 1.5 hours each
- **Participants**: 12 team members
- **Coach**: Marcus Wilson at $275/hr
- **Calculated Costs**:
  - Session Cost: $412.50
  - Program Cost: $2,475
  - Additional Participants: $1,650 (11 × $25 × 6)
  - Service Fee: $412.50 (10%)
  - **Total**: $4,537.50

## Security & Authorization

### Company Data Isolation

- Each company can only access their own coaches and programs
- API-level authorization checks prevent cross-company data access
- Analytics tracking for audit purposes

### Role-Based Access

- **Platform Admins**: Full access to all companies and coaches
- **Company Admins**: Limited to their company's data only
- **Coaches**: Can only view their own matches and assigned requests

## Technical Implementation

### Backward Compatibility

The system supports both timeline formats:

**Old Format** (string):

```javascript
timeline: "3 months";
```

**New Format** (detailed object):

```javascript
timeline: {
  startDate: "2024-02-05T00:00:00Z",
  endDate: "2024-05-05T00:00:00Z",
  sessionFrequency: "weekly",
  hoursPerSession: 2,
  totalSessions: 12
}
```

### Error Handling

- Graceful fallbacks for missing timeline data
- Default assumptions for session duration and frequency
- Proper error messages for authorization failures

## Benefits

1. **Transparency**: Companies see exactly what they're paying for
2. **Accuracy**: Precise cost calculations based on actual program structure
3. **Security**: Improved data separation prevents cross-company data leaks
4. **Scalability**: Flexible structure supports various program types
5. **Analytics**: Enhanced tracking for business insights

## Files Modified

- `src/pages/mentorship/MentorshipRequestDetails.tsx` - Enhanced cost display
- `src/data/demoDatabase.ts` - Updated timeline structure
- `src/services/apiEnhanced.ts` - Added company coaches method
- `COST_DISPLAY_ENHANCEMENTS.md` - This documentation

## Next Steps

The enhanced cost display and data separation provide a solid foundation for:

- Company-specific coach recommendations
- Advanced pricing models (volume discounts, package deals)
- Enhanced analytics and reporting
- Integration with payment processing systems
