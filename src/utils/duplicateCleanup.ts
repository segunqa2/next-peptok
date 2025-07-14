/**
 * Utility to clean up duplicate programs, specifically "Sales Growth 3X Plan"
 * This helps resolve the duplicate saving issue by removing duplicate entries
 */

export interface StoredRequest {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  companyId?: string;
}

export const duplicateCleanup = {
  /**
   * Remove duplicate "Sales Growth 3X Plan" programs from localStorage
   */
  removeDuplicateSalesGrowthPrograms(): number {
    try {
      const stored = localStorage.getItem("mentorship_requests");
      if (!stored) return 0;

      const requests: StoredRequest[] = JSON.parse(stored);
      const salesGrowthPrograms = requests.filter((req) =>
        req.title?.toLowerCase().includes("sales growth 3x plan"),
      );

      if (salesGrowthPrograms.length <= 1) {
        console.log("✅ No duplicate Sales Growth programs found");
        return 0;
      }

      // Keep the oldest one (first created), remove the rest
      const sortedPrograms = salesGrowthPrograms.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const toKeep = sortedPrograms[0];
      const toRemove = sortedPrograms.slice(1);

      // Filter out the duplicates
      const updatedRequests = requests.filter(
        (req) => !toRemove.some((duplicate) => duplicate.id === req.id),
      );

      localStorage.setItem(
        "mentorship_requests",
        JSON.stringify(updatedRequests),
      );

      console.log(
        `🧹 Removed ${toRemove.length} duplicate Sales Growth programs`,
      );
      console.log(`✅ Kept oldest program:`, toKeep);

      return toRemove.length;
    } catch (error) {
      console.error("Failed to clean up duplicates:", error);
      return 0;
    }
  },

  /**
   * Get all programs with similar titles for debugging
   */
  findSimilarPrograms(titlePattern: string): StoredRequest[] {
    try {
      const stored = localStorage.getItem("mentorship_requests");
      if (!stored) return [];

      const requests: StoredRequest[] = JSON.parse(stored);
      return requests.filter((req) =>
        req.title?.toLowerCase().includes(titlePattern.toLowerCase()),
      );
    } catch (error) {
      console.error("Failed to find similar programs:", error);
      return [];
    }
  },

  /**
   * List all stored programs for debugging
   */
  listAllStoredPrograms(): StoredRequest[] {
    try {
      const stored = localStorage.getItem("mentorship_requests");
      if (!stored) return [];

      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to list stored programs:", error);
      return [];
    }
  },

  /**
   * Run a complete cleanup of all duplicate programs
   */
  runCompleteCleanup(): { removedCount: number; totalPrograms: number } {
    const allPrograms = this.listAllStoredPrograms();
    const titleGroups = new Map<string, StoredRequest[]>();

    // Group by normalized title
    allPrograms.forEach((program) => {
      const normalizedTitle = program.title?.trim().toLowerCase() || "";
      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle)!.push(program);
    });

    let totalRemoved = 0;
    const programsToKeep: StoredRequest[] = [];

    // For each title group, keep only the oldest one
    titleGroups.forEach((programs, title) => {
      if (programs.length > 1) {
        // Sort by creation date, keep the oldest
        const sorted = programs.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        programsToKeep.push(sorted[0]);
        totalRemoved += sorted.length - 1;
        console.log(`🧹 Removed ${sorted.length - 1} duplicates of "${title}"`);
      } else {
        programsToKeep.push(programs[0]);
      }
    });

    // Update localStorage with cleaned data
    if (totalRemoved > 0) {
      localStorage.setItem(
        "mentorship_requests",
        JSON.stringify(programsToKeep),
      );
      console.log(
        `✅ Cleanup complete. Removed ${totalRemoved} duplicate programs`,
      );
    }

    return {
      removedCount: totalRemoved,
      totalPrograms: programsToKeep.length,
    };
  },
};

// Auto-run cleanup when this module is imported
if (typeof window !== "undefined") {
  // Run cleanup after a short delay to avoid blocking
  setTimeout(() => {
    const result = duplicateCleanup.runCompleteCleanup();
    if (result.removedCount > 0) {
      console.log(
        `🎉 Automatically cleaned up ${result.removedCount} duplicate programs`,
      );
    }
  }, 1000);
}
