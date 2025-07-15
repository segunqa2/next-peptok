import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // CORS configuration
  app.enableCors({
    origin: configService.get("FRONTEND_URL", "http://localhost:8080"),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix("api");

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle("Peptok Coaching Platform API")
    .setDescription(
      "Complete API documentation for the Peptok coaching and mentorship platform. " +
        "This API provides endpoints for user management, company administration, " +
        "coach matching, session management, and analytics.",
    )
    .setVersion("1.0")
    .addTag("auth", "Authentication and user management")
    .addTag("users", "User profiles and management")
    .addTag("companies", "Company administration")
    .addTag("coaches", "Coach profiles and management")
    .addTag("sessions", "Coaching session management")
    .addTag("matching", "Coach-client matching system")
    .addTag("analytics", "Platform analytics and metrics")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "Peptok API Documentation",
    customCss: `
      .topbar-wrapper { display: none; }
      .swagger-ui .topbar { display: none; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = configService.get("PORT", 3001);
  await app.listen(port);

  console.log(`🚀 Peptok NestJS API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔍 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Database: nestjs-database.sqlite`);
}

bootstrap().catch((error) => {
  console.error("Error starting application:", error);
  process.exit(1);
});
