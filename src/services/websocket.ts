import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  type: "text" | "system" | "session_update" | "program_update";
  timestamp: string;
  read: boolean;
  conversationId: string;
}

interface Notification {
  id: string;
  userId: string;
  type: "message" | "session" | "program" | "system";
  title: string;
  message: string;
  data?: any;
  read: boolean;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private notificationCallbacks: ((notification: Notification) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private isConnected = false;

  connect(userId: string, token?: string) {
    if (this.socket?.connected) {
      return;
    }

    // In production, this would connect to your WebSocket server
    const serverUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

    this.socket = io(serverUrl, {
      auth: {
        userId,
        token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("WebSocket connected");
      this.notifyConnectionCallbacks(true);
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("WebSocket disconnected");
      this.notifyConnectionCallbacks(false);
    });

    this.socket.on("new_message", (message: Message) => {
      this.notifyMessageCallbacks(message);

      // Show toast notification for new messages
      if (!message.read) {
        toast.info(`New message from ${message.senderName}`, {
          description: message.content.substring(0, 100),
          action: {
            label: "View",
            onClick: () => {
              // Navigate to conversation
              window.location.href = `/messages/${message.conversationId}`;
            },
          },
        });
      }
    });

    this.socket.on("new_notification", (notification: Notification) => {
      this.notifyNotificationCallbacks(notification);

      // Show toast for important notifications
      if (notification.type !== "message") {
        toast.info(notification.title, {
          description: notification.message,
        });
      }
    });

    this.socket.on("session_update", (data: any) => {
      const notification: Notification = {
        id: `session_${Date.now()}`,
        userId: data.userId,
        type: "session",
        title: "Session Update",
        message: data.message,
        data,
        read: false,
        timestamp: new Date().toISOString(),
      };

      this.notifyNotificationCallbacks(notification);
      toast.info("Session Update", { description: data.message });
    });

    this.socket.on("program_update", (data: any) => {
      const notification: Notification = {
        id: `program_${Date.now()}`,
        userId: data.userId,
        type: "program",
        title: "Program Update",
        message: data.message,
        data,
        read: false,
        timestamp: new Date().toISOString(),
      };

      this.notifyNotificationCallbacks(notification);
      toast.info("Program Update", { description: data.message });
    });

    // Handle connection errors
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
    });
  }

  // Send a message
  sendMessage(recipientId: string, content: string, conversationId: string) {
    if (!this.socket?.connected) {
      toast.error("Connection lost. Please try again.");
      return;
    }

    this.socket.emit("send_message", {
      recipientId,
      content,
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  // Mark message as read
  markMessageAsRead(messageId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("mark_message_read", { messageId });
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("mark_notification_read", { notificationId });
  }

  // Join a conversation room
  joinConversation(conversationId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("join_conversation", { conversationId });
  }

  // Leave a conversation room
  leaveConversation(conversationId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("leave_conversation", { conversationId });
  }

  // Join a session room for real-time updates
  joinSession(sessionId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("join_session", { sessionId });
  }

  // Leave a session room
  leaveSession(sessionId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("leave_session", { sessionId });
  }

  // Subscribe to message updates
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Subscribe to notification updates
  onNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Subscribe to connection status
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private notifyMessageCallbacks(message: Message) {
    this.messageCallbacks.forEach((callback) => callback(message));
  }

  private notifyNotificationCallbacks(notification: Notification) {
    this.notificationCallbacks.forEach((callback) => callback(notification));
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
    }
  }

  // Simulate connection for demo purposes
  simulateConnection(userId: string) {
    this.isConnected = true;
    this.notifyConnectionCallbacks(true);

    // Simulate some demo notifications
    setTimeout(() => {
      const demoNotification: Notification = {
        id: "demo_1",
        userId,
        type: "message",
        title: "Welcome!",
        message:
          "Welcome to the platform! You have real-time notifications enabled.",
        read: false,
        timestamp: new Date().toISOString(),
      };
      this.notifyNotificationCallbacks(demoNotification);
    }, 2000);

    // Simulate a message every 30 seconds for demo
    const messageInterval = setInterval(() => {
      const demoMessage: Message = {
        id: `demo_msg_${Date.now()}`,
        senderId: "demo_coach",
        senderName: "Demo Coach",
        recipientId: userId,
        content: "This is a demo message to show real-time messaging!",
        type: "text",
        timestamp: new Date().toISOString(),
        read: false,
        conversationId: "demo_conversation",
      };
      this.notifyMessageCallbacks(demoMessage);
    }, 30000);

    // Clean up demo interval after 5 minutes
    setTimeout(() => {
      clearInterval(messageInterval);
    }, 300000);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export types
export type { Message, Notification };
