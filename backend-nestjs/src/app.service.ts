import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Peptok NestJS API is running!";
  }

  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "peptok-nestjs-api",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  }
}
