import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { UsersService } from "../../modules/users/users.service";
import { CompaniesService } from "../../modules/companies/companies.service";
import { CoachesService } from "../../modules/coaches/coaches.service";
import { SessionsService } from "../../modules/sessions/sessions.service";
import { MatchingService } from "../../modules/matching/matching.service";
import * as bcrypt from "bcryptjs";

interface SeedUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  userType: "platform_admin" | "company_admin" | "coach" | "team_member";
  companyId?: string;
  picture?: string;
  provider?: string;
  joinedAt?: string;
  lastActive?: string;
  status?: string;
  bio?: string;
  skills?: string[];
  experience?: number;
  rating?: number;
  totalRatings?: number;
  hourlyRate?: number;
}

interface SeedCompany {
  name: string;
  email: string;
  industry: string;
  employeeCount: number;
  status: "active" | "trial";
  subscriptionTier: "starter" | "growth" | "enterprise";
}

interface SeedCoach {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  specialization: string;
  experience: "junior" | "mid" | "senior";
  hourlyRate: number;
  skills: string[];
  languages: string[];
  picture?: string;
  provider?: string;
  bio?: string;
  rating?: number;
  totalRatings?: number;
  joinedAt?: string;
  lastActive?: string;
  status?: string;
}

class DatabaseSeeder {
  private usersService: UsersService;
  private companiesService: CompaniesService;
  private coachesService: CoachesService;
  private sessionsService: SessionsService;
  private matchingService: MatchingService;

  constructor(
    usersService: UsersService,
    companiesService: CompaniesService,
    coachesService: CoachesService,
    sessionsService: SessionsService,
    matchingService: MatchingService,
  ) {
    this.usersService = usersService;
    this.companiesService = companiesService;
    this.coachesService = coachesService;
    this.sessionsService = sessionsService;
    this.matchingService = matchingService;
  }

  // Platform Admins
  private readonly platformAdmins: SeedUser[] = [
    {
      id: "admin_001",
      email: "admin@peptok.com",
      password: "admin123",
      name: "Platform Administrator",
      firstName: "Platform",
      lastName: "Administrator",
      userType: "platform_admin",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=platform-admin",
      provider: "email",
      joinedAt: "2024-01-01T00:00:00Z",
      lastActive: "2024-03-15T18:00:00Z",
      status: "active",
    },
    {
      id: "admin_002",
      email: "superadmin@peptok.com",
      password: "admin123",
      name: "Super Administrator",
      firstName: "Super",
      lastName: "Administrator",
      userType: "platform_admin",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=super-admin",
      provider: "email",
      joinedAt: "2024-01-01T00:00:00Z",
      lastActive: "2024-03-15T17:45:00Z",
      status: "active",
    },
  ];

  // Demo Companies Data
  private readonly companies: SeedCompany[] = [
    {
      name: "TechCorp Solutions",
      email: "admin@techcorp.com",
      industry: "Technology",
      employeeCount: 150,
      status: "active",
      subscriptionTier: "enterprise",
    },
    {
      name: "InnovateCo",
      email: "admin@innovateco.com",
      industry: "Innovation",
      employeeCount: 75,
      status: "active",
      subscriptionTier: "growth",
    },
  ];

  // Company Admins (one for each company)
  private readonly companyAdmins: SeedUser[] = [
    {
      id: "user_022",
      email: "admin@techcorp.com",
      password: "demo123",
      name: "TechCorp Admin",
      firstName: "TechCorp",
      lastName: "Admin",
      userType: "company_admin",
      companyId: "comp_001",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=techcorp-admin",
      provider: "email",
      joinedAt: "2024-01-15T00:00:00Z",
      lastActive: "2024-03-15T18:00:00Z",
      status: "active",
    },
    {
      id: "user_023",
      email: "employee1@techcorp.com",
      password: "emp123",
      name: "Sarah Johnson",
      firstName: "Sarah",
      lastName: "Johnson",
      userType: "company_admin", // Changed to company_admin as requested
      companyId: "comp_001",
      picture:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah-johnson-emp",
      provider: "email",
      joinedAt: "2024-01-20T00:00:00Z",
      lastActive: "2024-03-15T16:25:00Z",
      status: "active",
    },
    {
      id: "admin_003",
      email: "admin@innovateco.com",
      password: "admin123",
      name: "Michael Thompson",
      firstName: "Michael",
      lastName: "Thompson",
      userType: "company_admin",
      companyId: "comp_002",
      picture:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=michael-thompson",
      provider: "email",
      joinedAt: "2024-01-15T00:00:00Z",
      lastActive: "2024-03-15T17:15:00Z",
      status: "active",
    },
  ];

  // Team Members (2 for each company)
  private readonly teamMembers: SeedUser[] = [
    // TechCorp Solutions team members
    {
      id: "user_024",
      email: "employee2@techcorp.com",
      password: "emp123",
      name: "John Davis",
      firstName: "John",
      lastName: "Davis",
      userType: "team_member",
      companyId: "comp_001",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=john-davis",
      provider: "email",
      joinedAt: "2024-01-22T00:00:00Z",
      lastActive: "2024-03-15T16:30:00Z",
      status: "active",
    },
    {
      id: "user_025",
      email: "employee3@techcorp.com",
      password: "emp123",
      name: "Emily Carter",
      firstName: "Emily",
      lastName: "Carter",
      userType: "team_member",
      companyId: "comp_001",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily-carter",
      provider: "email",
      joinedAt: "2024-01-25T00:00:00Z",
      lastActive: "2024-03-15T15:45:00Z",
      status: "active",
    },
    // InnovateCo team members
    {
      id: "user_026",
      email: "employee1@innovateco.com",
      password: "emp123",
      name: "Alex Rodriguez",
      firstName: "Alex",
      lastName: "Rodriguez",
      userType: "team_member",
      companyId: "comp_002",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex-rodriguez",
      provider: "email",
      joinedAt: "2024-01-28T00:00:00Z",
      lastActive: "2024-03-15T16:00:00Z",
      status: "active",
    },
    {
      id: "user_027",
      email: "employee2@innovateco.com",
      password: "emp123",
      name: "Maria Silva",
      firstName: "Maria",
      lastName: "Silva",
      userType: "team_member",
      companyId: "comp_002",
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria-silva",
      provider: "email",
      joinedAt: "2024-02-01T00:00:00Z",
      lastActive: "2024-03-15T16:15:00Z",
      status: "active",
    },
  ];

  // 12 Coaches including Daniel Hayes
  private readonly coaches: SeedCoach[] = [
    {
      id: "user_004",
      email: "coach@marketing.com",
      password: "coach123",
      name: "Daniel Hayes",
      firstName: "Daniel",
      lastName: "Hayes",
      picture:
        "https://images.unsplash.com/photo-1494790108755-2616b612b1-3c?w=150",
      provider: "email",
      bio: "Senior marketing strategist and sales consultant with over 10 years of experience in building sales funnels and optimizing customer segmentation.",
      skills: [
        "Marketing",
        "Sales Funnel Optimization",
        "Persuasion and Negotiation",
        "Customer Segmentation",
      ],
      specialization: "Marketing Strategy",
      experience: "senior",
      hourlyRate: 180,
      languages: ["English"],
      rating: 4.9,
      totalRatings: 127,
      joinedAt: "2024-01-15T00:00:00Z",
      lastActive: "2024-03-15T17:30:00Z",
      status: "active",
    },
    {
      id: "coach_001",
      name: "Lisa Wilson",
      firstName: "Lisa",
      lastName: "Wilson",
      email: "lisa.wilson@peptok.com",
      specialization: "Leadership Development",
      experience: "senior",
      hourlyRate: 150,
      skills: [
        "Leadership",
        "Team Management",
        "Strategic Planning",
        "Communication",
      ],
      languages: ["English", "Spanish"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa-wilson",
      provider: "email",
      bio: "Experienced leadership coach with 12+ years helping executives and managers develop their leadership capabilities.",
      rating: 4.8,
      totalRatings: 98,
      joinedAt: "2024-01-10T00:00:00Z",
      lastActive: "2024-03-15T17:00:00Z",
      status: "active",
    },
    {
      id: "coach_002",
      name: "Michael Rodriguez",
      firstName: "Michael",
      lastName: "Rodriguez",
      email: "michael.rodriguez@peptok.com",
      specialization: "Sales & Business Development",
      experience: "senior",
      hourlyRate: 140,
      skills: [
        "Sales Strategy",
        "Business Development",
        "Negotiation",
        "Customer Relations",
      ],
      languages: ["English", "Spanish", "Portuguese"],
      picture:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=michael-rodriguez",
      provider: "email",
      bio: "Senior sales consultant with expertise in B2B sales strategy and business development.",
      rating: 4.7,
      totalRatings: 85,
      joinedAt: "2024-01-12T00:00:00Z",
      lastActive: "2024-03-15T16:45:00Z",
      status: "active",
    },
    {
      id: "coach_003",
      name: "Dr. Emily Watson",
      firstName: "Emily",
      lastName: "Watson",
      email: "emily.watson@peptok.com",
      specialization: "Executive Coaching",
      experience: "senior",
      hourlyRate: 200,
      skills: [
        "Executive Coaching",
        "Change Management",
        "Organizational Psychology",
        "Performance Improvement",
      ],
      languages: ["English", "French"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily-watson",
      provider: "email",
      bio: "PhD in Organizational Psychology with 15+ years experience in executive coaching and leadership development.",
      rating: 4.9,
      totalRatings: 156,
      joinedAt: "2024-01-08T00:00:00Z",
      lastActive: "2024-03-15T18:15:00Z",
      status: "active",
    },
    {
      id: "coach_004",
      name: "Alex Chen",
      firstName: "Alex",
      lastName: "Chen",
      email: "alex.chen@peptok.com",
      specialization: "Technical Leadership",
      experience: "mid",
      hourlyRate: 120,
      skills: [
        "Technical Leadership",
        "Software Architecture",
        "Team Building",
        "Agile Methodologies",
      ],
      languages: ["English", "Mandarin"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex-chen",
      provider: "email",
      bio: "Technical leader and software architect with 8 years experience in building and leading engineering teams.",
      rating: 4.6,
      totalRatings: 72,
      joinedAt: "2024-01-18T00:00:00Z",
      lastActive: "2024-03-15T17:20:00Z",
      status: "active",
    },
    {
      id: "coach_005",
      name: "Rachel Green",
      firstName: "Rachel",
      lastName: "Green",
      email: "rachel.green@peptok.com",
      specialization: "Career Development",
      experience: "mid",
      hourlyRate: 110,
      skills: [
        "Career Planning",
        "Personal Branding",
        "Interview Skills",
        "Professional Development",
      ],
      languages: ["English"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=rachel-green",
      provider: "email",
      bio: "Career development specialist helping professionals navigate career transitions and advancement.",
      rating: 4.5,
      totalRatings: 64,
      joinedAt: "2024-01-22T00:00:00Z",
      lastActive: "2024-03-15T16:30:00Z",
      status: "active",
    },
    {
      id: "coach_006",
      name: "David Kim",
      firstName: "David",
      lastName: "Kim",
      email: "david.kim@peptok.com",
      specialization: "Product Management",
      experience: "senior",
      hourlyRate: 160,
      skills: [
        "Product Strategy",
        "Roadmap Planning",
        "Stakeholder Management",
        "User Experience",
      ],
      languages: ["English", "Korean"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=david-kim",
      provider: "email",
      bio: "Senior product manager with 10+ years experience building successful digital products.",
      rating: 4.8,
      totalRatings: 91,
      joinedAt: "2024-01-14T00:00:00Z",
      lastActive: "2024-03-15T17:45:00Z",
      status: "active",
    },
    {
      id: "coach_007",
      name: "Sophie Anderson",
      firstName: "Sophie",
      lastName: "Anderson",
      email: "sophie.anderson@peptok.com",
      specialization: "Communication Skills",
      experience: "mid",
      hourlyRate: 125,
      skills: [
        "Public Speaking",
        "Presentation Skills",
        "Interpersonal Communication",
        "Conflict Resolution",
      ],
      languages: ["English", "German"],
      picture:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie-anderson",
      provider: "email",
      bio: "Communication coach specializing in public speaking and executive presence development.",
      rating: 4.7,
      totalRatings: 78,
      joinedAt: "2024-01-20T00:00:00Z",
      lastActive: "2024-03-15T16:50:00Z",
      status: "active",
    },
    {
      id: "coach_008",
      name: "James Mitchell",
      firstName: "James",
      lastName: "Mitchell",
      email: "james.mitchell@peptok.com",
      specialization: "Financial Planning",
      experience: "senior",
      hourlyRate: 170,
      skills: [
        "Financial Strategy",
        "Investment Planning",
        "Risk Management",
        "Business Finance",
      ],
      languages: ["English"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=james-mitchell",
      provider: "email",
      bio: "CFA with 12+ years in financial planning and business strategy consulting.",
      rating: 4.8,
      totalRatings: 103,
      joinedAt: "2024-01-11T00:00:00Z",
      lastActive: "2024-03-15T17:10:00Z",
      status: "active",
    },
    {
      id: "coach_009",
      name: "Anna Kowalski",
      firstName: "Anna",
      lastName: "Kowalski",
      email: "anna.kowalski@peptok.com",
      specialization: "Project Management",
      experience: "mid",
      hourlyRate: 135,
      skills: [
        "Project Planning",
        "Agile/Scrum",
        "Risk Management",
        "Team Coordination",
      ],
      languages: ["English", "Polish", "German"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=anna-kowalski",
      provider: "email",
      bio: "PMP certified project manager with expertise in agile methodologies and team leadership.",
      rating: 4.6,
      totalRatings: 68,
      joinedAt: "2024-01-16T00:00:00Z",
      lastActive: "2024-03-15T16:40:00Z",
      status: "active",
    },
    {
      id: "coach_010",
      name: "Carlos Mendoza",
      firstName: "Carlos",
      lastName: "Mendoza",
      email: "carlos.mendoza@peptok.com",
      specialization: "Innovation & Creativity",
      experience: "senior",
      hourlyRate: 145,
      skills: [
        "Design Thinking",
        "Innovation Strategy",
        "Creative Problem Solving",
        "Workshop Facilitation",
      ],
      languages: ["English", "Spanish"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos-mendoza",
      provider: "email",
      bio: "Innovation consultant helping organizations foster creativity and implement design thinking methodologies.",
      rating: 4.7,
      totalRatings: 82,
      joinedAt: "2024-01-13T00:00:00Z",
      lastActive: "2024-03-15T17:25:00Z",
      status: "active",
    },
    {
      id: "coach_011",
      name: "Jennifer Lee",
      firstName: "Jennifer",
      lastName: "Lee",
      email: "jennifer.lee@peptok.com",
      specialization: "HR & People Development",
      experience: "senior",
      hourlyRate: 155,
      skills: [
        "Talent Development",
        "Performance Management",
        "HR Strategy",
        "Organizational Culture",
      ],
      languages: ["English", "Korean"],
      picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=jennifer-lee",
      provider: "email",
      bio: "Senior HR executive with 11+ years experience in talent development and organizational culture transformation.",
      rating: 4.8,
      totalRatings: 94,
      joinedAt: "2024-01-17T00:00:00Z",
      lastActive: "2024-03-15T16:55:00Z",
      status: "active",
    },
  ];

  private async seedCompanies(): Promise<any[]> {
    console.log("🏢 Seeding companies...");
    const createdCompanies = [];

    for (const companyData of this.companies) {
      try {
        const company = await this.companiesService.create({
          ...companyData,
          website: `https://${companyData.name.toLowerCase().replace(/\s+/g, "")}.com`,
          description: `${companyData.name} is a leading ${companyData.industry.toLowerCase()} company focused on innovation and growth.`,
          monthlyBudget:
            companyData.subscriptionTier === "enterprise"
              ? 10000
              : companyData.subscriptionTier === "growth"
                ? 5000
                : 2000,
          maxUsers:
            companyData.subscriptionTier === "enterprise"
              ? 100
              : companyData.subscriptionTier === "growth"
                ? 50
                : 20,
          isActive: true,
        });
        createdCompanies.push(company);
        console.log(`✅ Created company: ${company.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create company ${companyData.name}:`,
          error.message,
        );
      }
    }

    return createdCompanies;
  }

  private async seedPlatformAdmins(): Promise<void> {
    console.log("🔧 Seeding platform admins...");

    for (const adminData of this.platformAdmins) {
      try {
        await this.usersService.create({
          ...adminData,
          password: await bcrypt.hash(adminData.password, 10),
          isEmailVerified: true,
          status: adminData.status || "active",
        });
        console.log(`✅ Created platform admin: ${adminData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create platform admin ${adminData.name}:`,
          error.message,
        );
      }
    }
  }

  private async seedCompanyAdmins(companies: any[]): Promise<void> {
    console.log("👔 Seeding company admins...");

    // Map company names to IDs for company admin assignment
    const companyMap = new Map();
    companies.forEach((company, index) => {
      if (index === 0) companyMap.set("TechCorp Solutions", company.id);
      if (index === 1) companyMap.set("InnovateCo", company.id);
    });

    for (const adminData of this.companyAdmins) {
      try {
        const userData = { ...adminData };

        // Assign correct company ID based on email domain
        if (adminData.email.includes("techcorp.com")) {
          userData.companyId = companyMap.get("TechCorp Solutions");
        } else if (adminData.email.includes("innovateco.com")) {
          userData.companyId = companyMap.get("InnovateCo");
        }

        await this.usersService.create({
          ...userData,
          password: await bcrypt.hash(adminData.password, 10),
          isEmailVerified: true,
          status: adminData.status || "active",
        });
        console.log(`✅ Created company admin: ${adminData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create company admin ${adminData.name}:`,
          error.message,
        );
      }
    }
  }

  private async seedTeamMembers(companies: any[]): Promise<void> {
    console.log("👥 Seeding team members...");

    // Map company names to IDs for team member assignment
    const companyMap = new Map();
    companies.forEach((company, index) => {
      if (index === 0) companyMap.set("TechCorp Solutions", company.id);
      if (index === 1) companyMap.set("InnovateCo", company.id);
    });

    for (const memberData of this.teamMembers) {
      try {
        const userData = { ...memberData };

        // Assign correct company ID based on email domain
        if (memberData.email.includes("techcorp.com")) {
          userData.companyId = companyMap.get("TechCorp Solutions");
        } else if (memberData.email.includes("innovateco.com")) {
          userData.companyId = companyMap.get("InnovateCo");
        }

        await this.usersService.create({
          ...userData,
          password: await bcrypt.hash(memberData.password, 10),
          isEmailVerified: true,
          status: memberData.status || "active",
        });
        console.log(`✅ Created team member: ${memberData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create team member ${memberData.name}:`,
          error.message,
        );
      }
    }
  }

  private async seedCoaches(): Promise<void> {
    console.log("🧑‍🏫 Seeding coaches...");

    for (const coachData of this.coaches) {
      try {
        // Create user for coach
        const user = await this.usersService.create({
          id: coachData.id,
          email: coachData.email,
          password: await bcrypt.hash(coachData.password || "coach123", 10),
          name: coachData.name,
          firstName: coachData.firstName,
          lastName: coachData.lastName,
          userType: "coach",
          picture: coachData.picture,
          provider: coachData.provider || "email",
          isEmailVerified: true,
          status: coachData.status || "active",
        });

        // Create coach profile
        await this.coachesService.create(
          {
            specialization: coachData.specialization,
            experience: coachData.experience,
            hourlyRate: coachData.hourlyRate,
            skills: coachData.skills,
            languages: coachData.languages,
            bio:
              coachData.bio ||
              `Experienced ${coachData.specialization.toLowerCase()} coach with proven track record of helping professionals achieve their goals.`,
            yearsExperience:
              coachData.experience === "senior"
                ? 10
                : coachData.experience === "mid"
                  ? 5
                  : 2,
            rating: coachData.rating || 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0 if not specified
            totalRatings:
              coachData.totalRatings || Math.floor(Math.random() * 100) + 20,
            isActive: true,
            isVerified: true,
          },
          user.id,
        );

        console.log(`✅ Created coach: ${coachData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create coach ${coachData.name}:`,
          error.message,
        );
      }
    }
  }

  private async seedPlatformStatistics(): Promise<void> {
    console.log("📊 Setting up platform statistics...");

    try {
      // Platform statistics can be calculated from existing data
      // or stored in a dedicated statistics table
      console.log("✅ Platform statistics ready for calculation");
    } catch (error) {
      console.error("❌ Failed to setup platform statistics:", error.message);
    }
  }

  async run(): Promise<void> {
    console.log("🌱 Starting comprehensive database seeding...");
    console.log("=".repeat(50));

    try {
      // 1. Seed companies first
      const companies = await this.seedCompanies();

      // 2. Seed platform admins
      await this.seedPlatformAdmins();

      // 3. Seed company admins
      await this.seedCompanyAdmins(companies);

      // 4. Seed team members
      await this.seedTeamMembers(companies);

      // 5. Seed coaches
      await this.seedCoaches();

      // 6. Setup platform statistics
      await this.seedPlatformStatistics();

      console.log("=".repeat(50));
      console.log("🎉 Database seeding completed successfully!");
      console.log("");
      console.log("📧 Demo Login Credentials:");
      console.log("   Platform Admins:");
      console.log("     admin@peptok.com / admin123");
      console.log("     superadmin@peptok.com / admin123");
      console.log("");
      console.log("   Company Admins:");
      console.log("     employee1@techcorp.com / emp123 (Sarah Johnson)");
      console.log("     admin@innovateco.com / admin123 (Michael Thompson)");
      console.log("");
      console.log("   Team Members:");
      console.log("     employee2@techcorp.com / emp123 (John Davis)");
      console.log("     employee3@techcorp.com / emp123 (Emily Carter)");
      console.log("     employee1@innovateco.com / emp123 (Alex Rodriguez)");
      console.log("     employee2@innovateco.com / emp123 (Maria Silva)");
      console.log("");
      console.log("   Coaches:");
      console.log("     coach@marketing.com / coach123 (Daniel Hayes)");
      console.log("     lisa.wilson@peptok.com / coach123 (Lisa Wilson)");
      console.log(
        "     michael.rodriguez@peptok.com / coach123 (Michael Rodriguez)",
      );
      console.log("     emily.watson@peptok.com / coach123 (Dr. Emily Watson)");
      console.log("     alex.chen@peptok.com / coach123 (Alex Chen)");
      console.log("     rachel.green@peptok.com / coach123 (Rachel Green)");
      console.log("     david.kim@peptok.com / coach123 (David Kim)");
      console.log(
        "     sophie.anderson@peptok.com / coach123 (Sophie Anderson)",
      );
      console.log("     james.mitchell@peptok.com / coach123 (James Mitchell)");
      console.log("     anna.kowalski@peptok.com / coach123 (Anna Kowalski)");
      console.log("     carlos.mendoza@peptok.com / coach123 (Carlos Mendoza)");
      console.log("     jennifer.lee@peptok.com / coach123 (Jennifer Lee)");
      console.log("");
      console.log("🏢 Companies:");
      console.log("   TechCorp Solutions (Enterprise tier)");
      console.log("   InnovateCo (Growth tier)");
      console.log("");
      console.log(
        "🚀 You can now test the frontend with comprehensive backend data!",
      );
    } catch (error) {
      console.error("❌ Database seeding failed:", error);
      throw error;
    }
  }
}

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    const usersService = app.get(UsersService);
    const companiesService = app.get(CompaniesService);
    const coachesService = app.get(CoachesService);
    const sessionsService = app.get(SessionsService);
    const matchingService = app.get(MatchingService);

    const seeder = new DatabaseSeeder(
      usersService,
      companiesService,
      coachesService,
      sessionsService,
      matchingService,
    );

    await seeder.run();
    await app.close();
  } catch (error) {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  }
}

bootstrap();
