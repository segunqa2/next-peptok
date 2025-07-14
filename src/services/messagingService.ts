import { apiEnhanced } from "./apiEnhanced";
import { analytics } from "./analytics";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "coach" | "company_admin" | "employee" | "platform_admin";
  recipientId: string;
  recipientName: string;
  recipientRole: "coach" | "company_admin" | "employee" | "platform_admin";
  content: string;
  messageType: "text" | "file" | "system" | "session_link";
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
  reactions?: MessageReaction[];
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  type: "direct" | "group" | "session_chat";
  title?: string;
  description?: string;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  sessionId?: string; // For session-related chats
  mentorshipRequestId?: string; // For program-related chats
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  role: "coach" | "company_admin" | "employee" | "platform_admin";
  avatar?: string;
  isOnline: boolean;
  lastSeenAt: Date;
  permissions: {
    canSendMessages: boolean;
    canSendFiles: boolean;
    canDeleteMessages: boolean;
    canAddParticipants: boolean;
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  isEncrypted: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

class MessagingService {
  private readonly API_BASE = "/messaging";
  private websocket: WebSocket | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private messageListeners: Set<(message: Message) => void> = new Set();
  private conversationListeners: Set<(conversation: Conversation) => void> =
    new Set();
  private typingListeners: Set<(typing: TypingIndicator) => void> = new Set();

  /**
   * Initialize real-time messaging connection
   */
  async initialize(userId: string): Promise<void> {
    try {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/messaging`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log("🔌 Messaging WebSocket connected");
        this.authenticate(userId);
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.websocket.onclose = () => {
        console.log("🔌 Messaging WebSocket disconnected");
        // Attempt to reconnect after delay
        setTimeout(() => this.initialize(userId), 3000);
      };

      this.websocket.onerror = (error) => {
        console.error("Messaging WebSocket error:", error);
      };
    } catch (error) {
      console.warn("WebSocket not available, using HTTP polling:", error);
      // Fall back to HTTP polling for messaging
      this.initializePolling(userId);
    }
  }

  private authenticate(userId: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "authenticate",
          userId,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case "new_message":
        this.messageListeners.forEach((listener) => listener(data.message));
        break;
      case "conversation_updated":
        this.conversationListeners.forEach((listener) =>
          listener(data.conversation),
        );
        break;
      case "typing_indicator":
        this.typingListeners.forEach((listener) =>
          listener(data.typingIndicator),
        );
        break;
      case "user_online":
        // Handle user online status updates
        break;
      default:
        console.log("Unknown WebSocket message type:", data.type);
    }
  }

  private initializePolling(userId: string): void {
    // Fallback polling implementation for when WebSocket is not available
    console.log("💬 Using HTTP polling for messaging");
    // Poll for new messages every 5 seconds
    setInterval(() => {
      this.pollForUpdates(userId);
    }, 5000);
  }

  private async pollForUpdates(userId: string): Promise<void> {
    try {
      // Poll for new messages and conversations
      // This is a simplified polling implementation
    } catch (error) {
      console.warn("Failed to poll for messaging updates:", error);
    }
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiEnhanced.request<Conversation[]>(
        `${this.API_BASE}/conversations`,
      );

      analytics.trackAction({
        action: "conversations_loaded",
        component: "messaging",
        metadata: {
          conversationCount: response.data.length,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock conversation data:", error);

      // Return mock conversations for demo
      return [
        {
          id: "conv-1",
          participants: [
            {
              userId: "coach-1",
              name: "Sarah Johnson",
              role: "coach",
              avatar: "https://avatar.vercel.sh/sarah@example.com",
              isOnline: true,
              lastSeenAt: new Date(),
              permissions: {
                canSendMessages: true,
                canSendFiles: true,
                canDeleteMessages: false,
                canAddParticipants: false,
              },
            },
            {
              userId: "user-1",
              name: "John Doe",
              role: "company_admin",
              isOnline: false,
              lastSeenAt: new Date(Date.now() - 30 * 60 * 1000),
              permissions: {
                canSendMessages: true,
                canSendFiles: true,
                canDeleteMessages: true,
                canAddParticipants: true,
              },
            },
          ],
          type: "direct",
          title: "Coaching Discussion",
          lastMessage: {
            id: "msg-1",
            conversationId: "conv-1",
            senderId: "coach-1",
            senderName: "Sarah Johnson",
            senderRole: "coach",
            recipientId: "user-1",
            recipientName: "John Doe",
            recipientRole: "company_admin",
            content: "How are you feeling about the progress so far?",
            messageType: "text",
            isRead: false,
            isEdited: false,
            isEncrypted: true,
            createdAt: new Date(Date.now() - 10 * 60 * 1000),
            updatedAt: new Date(Date.now() - 10 * 60 * 1000),
          },
          unreadCount: 2,
          isArchived: false,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 60 * 1000),
        },
      ];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    try {
      const response = await apiEnhanced.request<Message[]>(
        `${this.API_BASE}/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      );

      analytics.trackAction({
        action: "messages_loaded",
        component: "messaging",
        metadata: {
          conversationId,
          messageCount: response.data.length,
        },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock message data:", error);

      // Return mock messages for demo
      return [
        {
          id: "msg-1",
          conversationId,
          senderId: "coach-1",
          senderName: "Sarah Johnson",
          senderRole: "coach",
          recipientId: "user-1",
          recipientName: "John Doe",
          recipientRole: "company_admin",
          content: "Hi John! How are you feeling about the progress so far?",
          messageType: "text",
          isRead: false,
          isEdited: false,
          isEncrypted: true,
          createdAt: new Date(Date.now() - 10 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 60 * 1000),
        },
        {
          id: "msg-2",
          conversationId,
          senderId: "user-1",
          senderName: "John Doe",
          senderRole: "company_admin",
          recipientId: "coach-1",
          recipientName: "Sarah Johnson",
          recipientRole: "coach",
          content:
            "I'm feeling great! The team has been really engaged and I can see improvement in their communication skills.",
          messageType: "text",
          isRead: true,
          isEdited: false,
          isEncrypted: true,
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      ];
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: "text" | "file" = "text",
    attachments?: File[],
  ): Promise<Message> {
    try {
      const messageData = {
        conversationId,
        content,
        messageType,
        attachments: attachments
          ? await this.uploadAttachments(attachments)
          : undefined,
        timestamp: new Date().toISOString(),
      };

      const response = await apiEnhanced.request<Message>(
        `${this.API_BASE}/messages`,
        {
          method: "POST",
          body: JSON.stringify(messageData),
        },
      );

      analytics.trackAction({
        action: "message_sent",
        component: "messaging",
        metadata: {
          conversationId,
          messageType,
          hasAttachments: Boolean(attachments?.length),
        },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock message send:", error);

      // Return mock sent message for demo
      const mockMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: "current-user",
        senderName: "Current User",
        senderRole: "company_admin",
        recipientId: "coach-1",
        recipientName: "Coach",
        recipientRole: "coach",
        content,
        messageType,
        isRead: false,
        isEdited: false,
        isEncrypted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Notify listeners
      this.messageListeners.forEach((listener) => listener(mockMessage));

      return mockMessage;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    messageIds: string[],
  ): Promise<void> {
    try {
      await apiEnhanced.request(`${this.API_BASE}/messages/read`, {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          messageIds,
          readAt: new Date().toISOString(),
        }),
      });

      analytics.trackAction({
        action: "messages_marked_read",
        component: "messaging",
        metadata: {
          conversationId,
          messageCount: messageIds.length,
        },
      });
    } catch (error) {
      console.warn("Failed to mark messages as read:", error);
    }
  }

  /**
   * Start a new conversation
   */
  async startConversation(
    participantIds: string[],
    title?: string,
    initialMessage?: string,
  ): Promise<Conversation> {
    try {
      const conversationData = {
        participantIds,
        type: participantIds.length > 2 ? "group" : "direct",
        title,
        initialMessage,
      };

      const response = await apiEnhanced.request<Conversation>(
        `${this.API_BASE}/conversations`,
        {
          method: "POST",
          body: JSON.stringify(conversationData),
        },
      );

      analytics.trackAction({
        action: "conversation_started",
        component: "messaging",
        metadata: {
          participantCount: participantIds.length,
          hasInitialMessage: Boolean(initialMessage),
        },
      });

      return response.data;
    } catch (error) {
      console.warn("Using mock conversation creation:", error);

      // Return mock conversation for demo
      return {
        id: `conv-${Date.now()}`,
        participants: [],
        type: "direct",
        title: title || "New Conversation",
        unreadCount: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(
        JSON.stringify({
          type: "typing",
          conversationId,
          isTyping,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    // Clear previous typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.sendTypingIndicator(conversationId, false);
      }, 3000);
    }
  }

  /**
   * Upload file attachments
   */
  private async uploadAttachments(files: File[]): Promise<MessageAttachment[]> {
    const attachments: MessageAttachment[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiEnhanced.request<{ url: string; id: string }>(
          `${this.API_BASE}/attachments`,
          {
            method: "POST",
            body: formData,
          },
        );

        attachments.push({
          id: response.data.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: response.data.url,
          isEncrypted: true,
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files
      }
    }

    return attachments;
  }

  /**
   * Event listeners for real-time updates
   */
  onMessage(listener: (message: Message) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onConversationUpdate(
    listener: (conversation: Conversation) => void,
  ): () => void {
    this.conversationListeners.add(listener);
    return () => this.conversationListeners.delete(listener);
  }

  onTyping(listener: (typing: TypingIndicator) => void): () => void {
    this.typingListeners.add(listener);
    return () => this.typingListeners.delete(listener);
  }

  /**
   * Cleanup WebSocket connection
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // Clear all listeners
    this.messageListeners.clear();
    this.conversationListeners.clear();
    this.typingListeners.clear();
  }
}

export const messagingService = new MessagingService();
