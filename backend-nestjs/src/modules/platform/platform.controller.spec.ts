import { Test, TestingModule } from "@nestjs/testing";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { ForbiddenException } from "@nestjs/common";

describe("PlatformController", () => {
  let controller: PlatformController;
  let platformService: PlatformService;

  const mockPlatformService = {
    getPublicStatistics: jest.fn(),
    getStatistics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformController],
      providers: [
        {
          provide: PlatformService,
          useValue: mockPlatformService,
        },
      ],
    }).compile();

    controller = module.get<PlatformController>(PlatformController);
    platformService = module.get<PlatformService>(PlatformService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getHealth", () => {
    it("should return health status", () => {
      const result = controller.getHealth();

      expect(result).toEqual({
        status: "healthy",
        timestamp: expect.any(String),
        version: "1.0.0",
      });
    });
  });

  describe("getStatistics", () => {
    it("should return public platform statistics", async () => {
      const expectedStats = {
        totalCoaches: 12,
        totalSessions: 150,
        averageRating: 4.8,
        totalCompanies: 2,
      };

      mockPlatformService.getPublicStatistics.mockResolvedValue(expectedStats);

      const result = await controller.getStatistics();

      expect(platformService.getPublicStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });

  describe("getDetailedStatistics", () => {
    it("should return detailed statistics for platform admin", async () => {
      const expectedStats = {
        totalCoaches: 12,
        totalSessions: 150,
        averageRating: 4.8,
        totalCompanies: 2,
        totalActiveUsers: 20,
        monthlyGrowth: 15,
      };

      const mockRequest = {
        user: { userType: "platform_admin" },
      };

      mockPlatformService.getStatistics.mockResolvedValue(expectedStats);

      const result = await controller.getDetailedStatistics(mockRequest);

      expect(platformService.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });

    it("should throw ForbiddenException for non-admin users", async () => {
      const mockRequest = {
        user: { userType: "company_admin" },
      };

      await expect(
        controller.getDetailedStatistics(mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
