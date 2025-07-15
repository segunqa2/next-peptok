# Database Seeding Guide

This guide explains how to populate the Peptok platform database with comprehensive demo data including platform admins, company admins, team members, and coaches.

## 🌱 What Gets Seeded

### Platform Admins (2 users)

- **admin@peptok.com** / admin123 - Platform Administrator
- **superadmin@peptok.com** / admin123 - Super Administrator

### Companies (2 companies)

- **TechCorp Solutions** - Enterprise tier (150 employees)
- **InnovateCo** - Growth tier (75 employees)

### Company Admins (2 users)

- **employee1@techcorp.com** / emp123 - **Sarah Johnson** (TechCorp Solutions)
- **admin@innovateco.com** / admin123 - Michael Thompson (InnovateCo)

### Team Members (4 users, 2 per company)

**TechCorp Solutions:**

- **employee2@techcorp.com** / emp123 - John Davis
- **employee3@techcorp.com** / emp123 - Emily Carter

**InnovateCo:**

- **employee1@innovateco.com** / emp123 - Alex Rodriguez
- **employee2@innovateco.com** / emp123 - Maria Silva

### Coaches (12 coaches including Daniel Hayes)

1. **coach@marketing.com** / coach123 - **Daniel Hayes** (Marketing Strategy, $180/hr)
2. **lisa.wilson@peptok.com** / coach123 - Lisa Wilson (Leadership Development, $150/hr)
3. **michael.rodriguez@peptok.com** / coach123 - Michael Rodriguez (Sales & Business Development, $140/hr)
4. **emily.watson@peptok.com** / coach123 - Dr. Emily Watson (Executive Coaching, $200/hr)
5. **alex.chen@peptok.com** / coach123 - Alex Chen (Technical Leadership, $120/hr)
6. **rachel.green@peptok.com** / coach123 - Rachel Green (Career Development, $110/hr)
7. **david.kim@peptok.com** / coach123 - David Kim (Product Management, $160/hr)
8. **sophie.anderson@peptok.com** / coach123 - Sophie Anderson (Communication Skills, $125/hr)
9. **james.mitchell@peptok.com** / coach123 - James Mitchell (Financial Planning, $170/hr)
10. **anna.kowalski@peptok.com** / coach123 - Anna Kowalski (Project Management, $135/hr)
11. **carlos.mendoza@peptok.com** / coach123 - Carlos Mendoza (Innovation & Creativity, $145/hr)
12. **jennifer.lee@peptok.com** / coach123 - Jennifer Lee (HR & People Development, $155/hr)

## 🚀 Quick Start

### Method 1: PowerShell Script (Recommended)

```powershell
# Start development environment first
.\dev-start.ps1

# Run seeding
.\seed-database.ps1

# Test seeding results
.\test-seeding.ps1
```

### Method 2: Manual NestJS Commands

```bash
# Navigate to NestJS backend
cd backend-nestjs

# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Run seeding
npm run seed
```

### Method 3: Reset and Seed

```powershell
# Reset database and seed fresh data
.\seed-database.ps1 -Reset
```

## 🔧 Prerequisites

1. **Docker Environment Running**

   ```powershell
   .\dev-start.ps1  # Starts all services including database
   ```

2. **Database Container Active**

   - PostgreSQL container: `peptok-postgres`
   - Redis container: `peptok-redis`

3. **Backend Dependencies Installed**
   ```bash
   cd backend-nestjs
   npm install
   ```

## 📊 Verification

### Check Seeding Results

```powershell
.\test-seeding.ps1
```

### Manual Database Verification

```sql
-- Connect to database
docker exec -it peptok-postgres psql -U peptok_user -d peptok_dev

-- Check user counts by type
SELECT user_type, COUNT(*) FROM users GROUP BY user_type;

-- Verify specific users
SELECT name, email, user_type FROM users WHERE email IN (
  'employee1@techcorp.com',
  'coach@marketing.com'
);

-- Check companies
SELECT name, industry, subscription_tier FROM companies;

-- Check coaches with profiles
SELECT u.name, c.specialization, c.hourly_rate
FROM users u
JOIN coaches c ON u.id = c.user_id
WHERE u.user_type = 'coach';
```

## 🧪 Testing Session Modification Feature

After seeding, test the session modification functionality:

1. **Login as Sarah Johnson (Company Admin)**

   - Email: `employee1@techcorp.com`
   - Password: `emp123`

2. **Login as Daniel Hayes (Coach)**

   - Email: `coach@marketing.com`
   - Password: `coach123`

3. **Navigate to Session Validation**
   - URL: `http://localhost:5173/session-validation`
   - Test role-based access controls
   - Validate modification workflow

## 🔍 Troubleshooting

### Database Connection Issues

```powershell
# Check if containers are running
docker ps

# Restart development environment
.\dev-restart.ps1

# Check database logs
docker logs peptok-postgres
```

### Seeding Failures

```bash
# Reset database and try again
cd backend-nestjs
npm run schema:drop
npm run schema:sync
npm run seed
```

### Permission Errors

```powershell
# Ensure Docker is running with admin privileges
# Restart PowerShell as Administrator if needed
```

## 📁 File Structure

```
├── backend-nestjs/src/database/seeds/
│   └── run-seed.ts                    # Main seeding script
├── seed-database.ps1                  # PowerShell seeding utility
├── test-seeding.ps1                   # Seeding verification script
└── DATABASE_SEEDING_GUIDE.md         # This guide
```

## 🎯 User Stories Validated

The seeded data supports these specific user stories:

1. **Company Admin Session Modification**

   - Sarah Johnson can request schedule modifications
   - Proper authorization checks in place

2. **Coach Approval Workflow**

   - Daniel Hayes can approve/reject modification requests
   - Session start blocking during pending modifications

3. **Role-Based Access Control**

   - Platform admins have override capabilities
   - Team members have view-only access

4. **Multi-Company Support**
   - Two different companies with separate user bases
   - Company-specific data isolation

## 🔄 Regular Maintenance

### Reset Database for Testing

```powershell
.\seed-database.ps1 -Reset
```

### Update Seed Data

Modify `backend-nestjs/src/database/seeds/run-seed.ts` and re-run:

```bash
npm run seed
```

### Production Considerations

- Remove demo passwords before production
- Use environment variables for sensitive data
- Implement proper user invitation flows

## ✅ Success Criteria

After successful seeding, you should be able to:

- [x] Login with Sarah Johnson (Company Admin)
- [x] Login with Daniel Hayes (Coach)
- [x] Access session modification features
- [x] Test role-based authorization
- [x] Validate coach approval workflow
- [x] See realistic coach profiles and ratings
- [x] Navigate company-specific dashboards

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify Docker environment is properly running
3. Review seeding script logs for specific errors
4. Test with the validation scripts provided

The seeding system is designed to be reliable and comprehensive, providing a complete test environment for all platform features.
