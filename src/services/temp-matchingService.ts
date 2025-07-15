// This is a temporary file to help fix the matchingService.ts

// Keep everything before the generateMockCoaches method and replace from that point

  private generateMockCoaches(): Omit<
    CoachMatch,
    "matchScore" | "matchReasons" | "estimatedCost"
  >[] {
    console.warn("Mock coaches disabled - use backend API instead");
    return []; // All mock data removed - use backend API instead
  }

  private async getAvailableCoaches(): Promise<
    Omit<CoachMatch, "matchScore" | "matchReasons" | "estimatedCost">[]
  > {
    try {
      // Try to get real coaches from the platform
      const coaches = await apiEnhanced.getAllCoaches();

      if (coaches && coaches.length > 0) {
        // Transform platform coaches to matching format
        return coaches.map((coach: any) => ({
          id: coach.id,
          name: `${coach.firstName} ${coach.lastName}`,
          title: coach.title || "Professional Coach",
          skills: coach.skills || coach.coaching?.map((c: any) => c.name) || [],
          experience: this.mapExperienceLevel(
            coach.yearsExperience || coach.experience,
          ),
          rating: coach.metrics?.averageRating || coach.rating || 4.0,
          availability: coach.availability || "available",
          hourlyRate: coach.hourlyRate || 150,
          profileImage: coach.profilePicture || coach.avatar || "",
          bio: coach.bio || "",
          expertise: coach.expertise || coach.skills || [],
          yearsExperience: coach.yearsExperience || 5,
          languages: coach.languages || ["English"],
          timezone: coach.timezone || "UTC",
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch coaches from platform:", error);
    }

    // Fallback to mock data for development
    return this.generateMockCoaches();
  }