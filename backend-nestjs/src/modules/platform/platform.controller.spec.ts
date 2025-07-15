import { Test, TestingModule } from "@nestjs/testing";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";

describe("PlatformController", () => {
  let controller: PlatformController;
  let platformService: PlatformService;

  const mockPlatformService = {
    getHealth: jest.fn(),
    getPublicStatistics: jest.fn(),
    getAdminStatistics: jest.fn(),
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
    it("should return health status", async () => {
      const expectedHealth = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00.000Z",
        version: "1.0.0",
      };

      mockPlatformService.getHealth.mockResolvedValue(expectedHealth);

      const result = await controller.getHealth();

      expect(platformService.getHealth).toHaveBeenCalled();
      expect(result).toEqual(expectedHealth);
    });
  });

  describe("getPublicStatistics", () => {
    it("should return public platform statistics", async () => {
      const expectedStats = {
        totalCoaches: 12,
        totalSessions: 150,
        averageRating: 4.8,
        totalCompanies: 2,
      };

      mockPlatformService.getPublicStatistics.mockResolvedValue(expectedStats);

      const result = await controller.getPublicStatistics();

      expect(platformService.getPublicStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });

  describe("getAdminStatistics", () => {
    it("should return admin platform statistics", async () => {
      const expectedStats = {
        totalCoaches: 12,
        totalSessions: 150,
        averageRating: 4.8,
        totalCompanies: 2,
        totalActiveUsers: 20,
        monthlyGrowth: 15,
      };

      mockPlatformService.getAdminStatistics.mockResolvedValue(expectedStats);

      const result = await controller.getAdminStatistics();

      expect(platformService.getAdminStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });
});
