#!/bin/bash

# Fix remaining imports from deleted api service
files=(
  "src/pages/ExpertDirectory.tsx"
  "src/pages/mentorship/MentorshipRequestDetails.tsx"
  "src/components/sessions/VideoConference.tsx"
  "src/components/common/DashboardDiagnostic.tsx"
  "src/components/coach/CoachSessionSettings.tsx"
  "src/components/testing/ButtonValidationTest.tsx"
  "src/components/onboarding/SubscriptionTiers.tsx"
  "src/components/mentorship/CoachSearch.tsx"
  "src/components/mentorship/MentorshipRequestProgress.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    sed -i 's|import { api } from "@/services/api";|import { api } from "@/services/apiEnhanced";|g' "$file"
    echo "Fixed: $file"
  else
    echo "Not found: $file"
  fi
done

echo "Done fixing imports"
