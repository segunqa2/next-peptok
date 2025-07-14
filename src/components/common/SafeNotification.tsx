import React from "react";

// Hook-free notification system for when React hooks are not available
class SafeNotificationManager {
  private notifications: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }> = [];

  show(
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) {
    const notification = {
      id: `notification_${Date.now()}`,
      message,
      type,
    };

    this.notifications.push(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.remove(notification.id);
    }, 5000);

    // Simple DOM-based display
    this.displayNotification(notification);

    return notification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    const element = document.getElementById(`safe-notification-${id}`);
    if (element) {
      element.remove();
    }
  }

  private displayNotification(notification: any) {
    // Create DOM element directly without React
    const container = this.getOrCreateContainer();

    const element = document.createElement("div");
    element.id = `safe-notification-${notification.id}`;
    element.style.cssText = `
      background: ${this.getBackgroundColor(notification.type)};
      color: white;
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: relative;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;

    element.innerHTML = `
      ${notification.message}
      <button onclick="document.getElementById('${element.id}').remove()" 
              style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); 
                     background: none; border: none; color: white; cursor: pointer; font-size: 16px;">
        ×
      </button>
    `;

    container.appendChild(element);
  }

  private getOrCreateContainer() {
    let container = document.getElementById("safe-notifications");
    if (!container) {
      container = document.createElement("div");
      container.id = "safe-notifications";
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;

      // Add CSS animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(container);
    }
    return container;
  }

  private getBackgroundColor(type: string) {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  }
}

export const safeNotificationManager = new SafeNotificationManager();

// Safe toast API that works without React hooks
export const safeToast = {
  success: (message: string) =>
    safeNotificationManager.show(message, "success"),
  error: (message: string) => safeNotificationManager.show(message, "error"),
  info: (message: string) => safeNotificationManager.show(message, "info"),
  warning: (message: string) =>
    safeNotificationManager.show(message, "warning"),
};

// Safe notification component that doesn't use hooks
export const SafeNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <>
      {children}
      {/* Container will be created by the manager when needed */}
    </>
  );
};
