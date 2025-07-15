import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() createUserDto: any) {
    return this.authService.register(createUserDto);
  }

  @ApiOperation({
    summary: "Authenticate user with email and password",
    description:
      "Login endpoint that accepts email and password credentials and returns JWT token",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@company.com" },
        password: { type: "string", example: "password123" },
      },
      required: ["email", "password"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Successfully authenticated",
    schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            name: { type: "string" },
            userType: { type: "string" },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
  })
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req: any) {
    // Initiates Google OAuth flow
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const { accessToken } = await this.authService.login(req.user);
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: "Logged out successfully" };
  }

  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    return this.authService.forgotPassword({ email });
  }

  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: any) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
