import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should return access token and user on successful login", async () => {
      const loginDto = {
        email: "admin@techcorp.com",
        password: "demo123",
      };

      const expectedResult = {
        access_token: "jwt-token",
        user: {
          id: "user-1",
          email: "admin@techcorp.com",
          name: "TechCorp Admin",
          userType: "company_admin",
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it("should throw error on invalid credentials", async () => {
      const loginDto = {
        email: "invalid@example.com",
        password: "wrongpassword",
      };

      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      await expect(controller.login(loginDto)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("register", () => {
    it("should create a new user and return token", async () => {
      const registerDto = {
        email: "newuser@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
        userType: "team_member",
      };

      const expectedResult = {
        access_token: "jwt-token",
        user: {
          id: "user-2",
          email: "newuser@example.com",
          name: "New User",
          userType: "team_member",
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
