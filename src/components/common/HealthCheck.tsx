import * as React from "react";

export const HealthCheck: React.FC = () => {
  const [isHealthy, setIsHealthy] = React.useState(false);

  React.useEffect(() => {
    // Simple check to ensure React hooks are working
    try {
      setIsHealthy(true);
      console.log("✅ React hooks are working properly");
    } catch (error) {
      console.error("❌ React hooks error:", error);
    }
  }, []);

  // Only render in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: isHealthy ? "#10B981" : "#EF4444",
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        zIndex: 9999,
        opacity: 0.8,
      }}
    >
      React: {isHealthy ? "✅" : "❌"}
    </div>
  );
};
