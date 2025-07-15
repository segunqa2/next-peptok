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
      const mockUser = {
        id: "user-1",
        email: "admin@techcorp.com",
        name: "TechCorp Admin",
        userType: "company_admin",
      };

      const expectedResult = {
        access_token: "jwt-token",
        user: mockUser,
      };

      const mockRequest = { user: mockUser };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(mockRequest);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedResult);
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
