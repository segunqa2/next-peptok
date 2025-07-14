import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get<string>(
        "GOOGLE_CALLBACK_URL",
        "http://localhost:3001/api/v1/auth/google/callback",
      ),
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const googleProfile = {
      id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };

    try {
      // For now, just return the profile - Google login can be implemented later
      done(null, googleProfile);
    } catch (error) {
      done(error, null);
    }
  }
}
