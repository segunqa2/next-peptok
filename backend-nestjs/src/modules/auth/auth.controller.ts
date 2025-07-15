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

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() createUserDto: any) {
    return this.authService.register(createUserDto);
  }

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
