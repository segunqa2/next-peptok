import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Paperclip,
  Phone,
  Video,
  Search,
  MoreVertical,
  Shield,
  Users,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  messagingService,
  Message,
  Conversation,
  TypingIndicator,
} from "@/services/messagingService";
import { useAuth } from "@/contexts/AuthContext";

interface SecureMessagingProps {
  initialConversationId?: string;
  participants?: string[];
  className?: string;
}

export const SecureMessaging: React.FC<SecureMessagingProps> = ({
  initialConversationId,
  participants = [],
  className = "",
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeMessaging();
    return () => {
      messagingService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      const conversation = conversations.find(
        (c) => c.id === initialConversationId,
      );
      if (conversation) {
        setActiveConversation(conversation);
        loadMessages(initialConversationId);
      }
    }
  }, [initialConversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMessaging = async () => {
    try {
      setLoading(true);

      // Initialize WebSocket connection
      if (user?.id) {
        await messagingService.initialize(user.id);
      }

      // Load conversations
      const userConversations = await messagingService.getConversations();
      setConversations(userConversations);

      // Set up real-time listeners
      const unsubscribeMessage = messagingService.onMessage(handleNewMessage);
      const unsubscribeConversation = messagingService.onConversationUpdate(
        handleConversationUpdate,
      );
      const unsubscribeTyping = messagingService.onTyping(handleTypingUpdate);

      // Auto-select first conversation if none specified
      if (!initialConversationId && userConversations.length > 0) {
        const firstConv = userConversations[0];
        setActiveConversation(firstConv);
        loadMessages(firstConv.id);
      }

      console.log("💬 Messaging initialized successfully");
    } catch (error) {
      console.error("Failed to initialize messaging:", error);
      toast.error("Failed to load messaging");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const conversationMessages =
        await messagingService.getMessages(conversationId);
      setMessages(conversationMessages);

      // Mark messages as read
      const unreadMessageIds = conversationMessages
        .filter((msg) => !msg.isRead && msg.senderId !== user?.id)
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        await messagingService.markAsRead(conversationId, unreadMessageIds);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleNewMessage = (message: Message) => {
    if (message.conversationId === activeConversation?.id) {
      setMessages((prev) => [...prev, message]);

      // Mark as read if we're viewing the conversation
      if (message.senderId !== user?.id) {
        messagingService.markAsRead(message.conversationId, [message.id]);
      }
    }

    // Update conversation with latest message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === message.conversationId
          ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
          : conv,
      ),
    );
  };

  const handleConversationUpdate = (conversation: Conversation) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversation.id ? conversation : conv)),
    );
  };

  const handleTypingUpdate = (typing: TypingIndicator) => {
    if (typing.conversationId === activeConversation?.id) {
      setTypingUsers((prev) => {
        if (typing.isTyping) {
          return [...prev.filter((t) => t.userId !== typing.userId), typing];
        } else {
          return prev.filter((t) => t.userId !== typing.userId);
        }
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) {
      return;
    }

    setSending(true);
    try {
      const message = await messagingService.sendMessage(
        activeConversation.id,
        newMessage.trim(),
      );

      setMessages((prev) => [...prev, message]);
      setNewMessage("");

      // Stop typing indicator
      messagingService.sendTypingIndicator(activeConversation.id, false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!activeConversation) return;

    // Send typing indicator
    if (value.trim()) {
      messagingService.sendTypingIndicator(activeConversation.id, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        messagingService.sendTypingIndicator(activeConversation.id, false);
      }, 2000);
    } else {
      messagingService.sendTypingIndicator(activeConversation.id, false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !activeConversation) return;

    try {
      setSending(true);
      const message = await messagingService.sendMessage(
        activeConversation.id,
        `Shared ${files.length} file${files.length > 1 ? "s" : ""}`,
        "file",
        files,
      );

      setMessages((prev) => [...prev, message]);
      toast.success("File(s) shared successfully");
    } catch (error) {
      console.error("Failed to share files:", error);
      toast.error("Failed to share files");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  const formatConversationTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.some((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Secure Messages
            </h2>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    loadMessages(conversation.id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversation?.id === conversation.id
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={conversation.participants[0]?.avatar}
                        />
                        <AvatarFallback>
                          {conversation.participants[0]?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.participants[0]?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">
                          {conversation.title ||
                            conversation.participants
                              .map((p) => p.name)
                              .join(", ")}
                        </h4>
                        <div className="flex items-center gap-1">
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white text-xs px-1 min-w-5 h-5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage &&
                              formatConversationTime(
                                conversation.lastMessage.createdAt,
                              )}
                          </span>
                        </div>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.senderId === user?.id
                            ? "You: "
                            : ""}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={activeConversation.participants[0]?.avatar}
                  />
                  <AvatarFallback>
                    {activeConversation.participants[0]?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {activeConversation.title ||
                      activeConversation.participants
                        .map((p) => p.name)
                        .join(", ")}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    End-to-end encrypted
                    {activeConversation.participants[0]?.isOnline && (
                      <span className="ml-2 text-green-600">• Online</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-white border"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-xs ${
                            message.senderId === user?.id
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {message.isEncrypted && (
                          <Shield className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {typingUsers.map((t) => t.userName).join(", ")}{" "}
                        typing...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={sending}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelected}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
