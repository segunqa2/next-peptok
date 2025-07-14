import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/analytics";

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Track page views automatically
  useEffect(() => {
    if (user) {
      const pageName =
        location.pathname.split("/").filter(Boolean).join("_") || "home";

      analytics.pageView({
        page: pageName,
        userId: user.id,
        userType: user.userType,
        referrer: document.referrer,
      });

      // Track time spent on page
      const startTime = Date.now();

      return () => {
        const timeSpent = Date.now() - startTime;
        analytics.trackPerformance("page_time_spent", timeSpent, {
          page: pageName,
          userId: user.id,
          userType: user.userType,
        });
      };
    }
  }, [location.pathname, user]);

  // Track user interactions
  const trackAction = (
    action: string,
    component: string,
    metadata?: Record<string, any>,
  ) => {
    analytics.trackAction({
      action,
      component,
      userId: user?.id,
      userType: user?.userType,
      metadata,
    });
  };

  // Track business events
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, {
      ...properties,
      userId: user?.id,
      userType: user?.userType,
    });
  };

  // Track errors
  const trackError = (error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, {
      ...context,
      userId: user?.id,
      userType: user?.userType,
      page: location.pathname,
    });
  };

  return {
    trackAction,
    trackEvent,
    trackError,
    analytics,
  };
};

export default useAnalytics;
