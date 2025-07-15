import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { UsersService } from "../../modules/users/users.service";
import { CompaniesService } from "../../modules/companies/companies.service";
import { CoachesService } from "../../modules/coaches/coaches.service";
import { SessionsService } from "../../modules/sessions/sessions.service";
import { MatchingService } from "../../modules/matching/matching.service";
import * as bcrypt from "bcryptjs";

interface SeedUser {
  email: string;
  password: string;
  name: string;
  userType: "platform_admin" | "company_admin" | "coach" | "team_member";
  companyId?: string;
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
  name: string;
  email: string;
  specialization: string;
  experience: "junior" | "mid" | "senior";
  hourlyRate: number;
  skills: string[];
  languages: string[];
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
      name: "StartupXYZ",
      email: "admin@startupxyz.com",
      industry: "Startup",
      employeeCount: 25,
      status: "active",
      subscriptionTier: "growth",
    },
    {
      name: "Global Consulting Inc",
      email: "admin@globalconsulting.com",
      industry: "Consulting",
      employeeCount: 300,
      status: "active",
      subscriptionTier: "enterprise",
    },
    {
      name: "Digital Marketing Pro",
      email: "admin@digitalmarketing.com",
      industry: "Marketing",
      employeeCount: 45,
      status: "trial",
      subscriptionTier: "starter",
    },
  ];

  // Demo Coaches Data
  private readonly coaches: SeedCoach[] = [
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@peptok.com",
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
    },
    {
      name: "Michael Rodriguez",
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
    },
    {
      name: "Dr. Emily Watson",
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
    },
    {
      name: "Alex Chen",
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
    },
    {
      name: "Lisa Wilson",
      email: "lisa.wilson@peptok.com",
      specialization: "Marketing Strategy",
      experience: "senior",
      hourlyRate: 130,
      skills: [
        "Digital Marketing",
        "Brand Strategy",
        "Content Marketing",
        "Social Media Strategy",
      ],
      languages: ["English"],
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

  private async seedUsers(companies: any[]): Promise<void> {
    console.log("👥 Seeding users...");

    // Platform Admin
    const platformAdmin: SeedUser = {
      email: "admin@peptok.com",
      password: "admin123",
      name: "Platform Administrator",
      userType: "platform_admin",
    };

    try {
      await this.usersService.create({
        ...platformAdmin,
        password: await bcrypt.hash(platformAdmin.password, 10),
        isEmailVerified: true,
        status: "active",
      });
      console.log("✅ Created platform admin");
    } catch (error) {
      console.error("❌ Failed to create platform admin:", error.message);
    }

    // Company Admins and Team Members
    for (const company of companies) {
      // Company Admin
      const companyAdmin: SeedUser = {
        email: `admin@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
        password: "admin123",
        name: `${company.name} Administrator`,
        userType: "company_admin",
        companyId: company.id,
      };

      try {
        await this.usersService.create({
          ...companyAdmin,
          password: await bcrypt.hash(companyAdmin.password, 10),
          isEmailVerified: true,
          status: "active",
        });
        console.log(`✅ Created company admin for ${company.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create company admin for ${company.name}:`,
          error.message,
        );
      }

      // Team Members
      const teamMembers = [
        `john.doe@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
        `jane.smith@${company.name.toLowerCase().replace(/\s+/g, "")}.com`,
      ];

      for (const email of teamMembers) {
        const teamMember: SeedUser = {
          email,
          password: "user123",
          name: email
            .split("@")[0]
            .replace(".", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          userType: "team_member",
          companyId: company.id,
        };

        try {
          await this.usersService.create({
            ...teamMember,
            password: await bcrypt.hash(teamMember.password, 10),
            isEmailVerified: true,
            status: "active",
          });
          console.log(`✅ Created team member: ${teamMember.name}`);
        } catch (error) {
          console.error(
            `❌ Failed to create team member ${teamMember.name}:`,
            error.message,
          );
        }
      }
    }
  }

  private async seedCoaches(): Promise<void> {
    console.log("🧑‍🏫 Seeding coaches...");

    for (const coachData of this.coaches) {
      try {
        // Create user for coach
        const user = await this.usersService.create({
          email: coachData.email,
          password: await bcrypt.hash("coach123", 10),
          name: coachData.name,
          userType: "coach",
          isEmailVerified: true,
          status: "active",
        });

        // Create coach profile
        await this.coachesService.create({
          userId: user.id,
          specialization: coachData.specialization,
          experience: coachData.experience,
          hourlyRate: coachData.hourlyRate,
          skills: coachData.skills,
          languages: coachData.languages,
          bio: `Experienced ${coachData.specialization.toLowerCase()} coach with proven track record of helping professionals achieve their goals.`,
          yearsExperience:
            coachData.experience === "senior"
              ? 10
              : coachData.experience === "mid"
                ? 5
                : 2,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          isActive: true,
          isVerified: true,
        });

        console.log(`✅ Created coach: ${coachData.name}`);
      } catch (error) {
        console.error(
          `��� Failed to create coach ${coachData.name}:`,
          error.message,
        );
      }
    }
  }

  private async seedPlatformStatistics(): Promise<void> {
    console.log("📊 Setting up platform statistics...");

    // This would typically be handled by your analytics service
    // For now, we'll create some basic data that the frontend can fetch
    try {
      // Platform statistics can be calculated from existing data
      // or stored in a dedicated statistics table
      console.log("✅ Platform statistics ready for calculation");
    } catch (error) {
      console.error("❌ Failed to setup platform statistics:", error.message);
    }
  }

  async run(): Promise<void> {
    console.log("🌱 Starting database seeding...");
    console.log("=".repeat(50));

    try {
      // 1. Seed companies first
      const companies = await this.seedCompanies();

      // 2. Seed users (admin, company admins, team members)
      await this.seedUsers(companies);

      // 3. Seed coaches
      await this.seedCoaches();

      // 4. Setup platform statistics
      await this.seedPlatformStatistics();

      console.log("=".repeat(50));
      console.log("🎉 Database seeding completed successfully!");
      console.log("");
      console.log("📧 Demo Login Credentials:");
      console.log("   Platform Admin: admin@peptok.com / admin123");
      console.log("   Company Admin:  admin@techcorp.com / admin123");
      console.log("   Team Member:    john.doe@techcorp.com / user123");
      console.log("   Coach:          sarah.johnson@peptok.com / coach123");
      console.log("");
      console.log("🚀 You can now test the frontend with real backend data!");
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
