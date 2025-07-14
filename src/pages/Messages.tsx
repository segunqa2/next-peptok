import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Online,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { websocketService, Message } from "@/services/websocket";
import { toast } from "sonner";

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: "coach" | "team_member" | "company_admin";
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
}

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    websocketService.simulateConnection(user.id);

    // Subscribe to connection changes
    const unsubscribeConnection =
      websocketService.onConnectionChange(setIsConnected);

    // Subscribe to new messages
    const unsubscribeMessages = websocketService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);

      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: message.content,
                lastMessageTime: message.timestamp,
                unreadCount: conv.unreadCount + 1,
              }
            : conv,
        ),
      );

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    // Load mock conversations
    const mockConversations: Conversation[] = [
      {
        id: "conv-1",
        participantId: "coach-1",
        participantName: "Sarah Johnson",
        participantAvatar: "https://avatar.vercel.sh/sarah@example.com",
        participantRole: "coach",
        lastMessage: "How did the leadership session go?",
        lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        unreadCount: 2,
        isOnline: true,
      },
      {
        id: "conv-2",
        participantId: "admin-1",
        participantName: "John Admin",
        participantAvatar: "https://avatar.vercel.sh/john@example.com",
        participantRole: "company_admin",
        lastMessage: "Program updates are ready for review",
        lastMessageTime: new Date(
          Date.now() - 2 * 60 * 60 * 1000,
        ).toISOString(),
        unreadCount: 0,
        isOnline: false,
      },
      {
        id: "conv-3",
        participantId: "team-1",
        participantName: "Team Member",
        participantAvatar: "https://avatar.vercel.sh/team@example.com",
        participantRole: "team_member",
        lastMessage: "Thanks for the session feedback!",
        lastMessageTime: new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString(),
        unreadCount: 1,
        isOnline: true,
      },
    ];

    setConversations(mockConversations);

    // If conversationId is provided, select that conversation
    if (conversationId) {
      const conversation = mockConversations.find(
        (c) => c.id === conversationId,
      );
      if (conversation) {
        selectConversation(conversation);
      }
    }

    return () => {
      unsubscribeConnection();
      unsubscribeMessages();
    };
  }, [user, conversationId]);

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    websocketService.joinConversation(conversation.id);

    // Load mock messages for this conversation
    const mockMessages: Message[] = [
      {
        id: "msg-1",
        senderId: conversation.participantId,
        senderName: conversation.participantName,
        senderAvatar: conversation.participantAvatar,
        recipientId: user?.id || "",
        content: "Hi! I wanted to follow up on our last session.",
        type: "text",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        conversationId: conversation.id,
      },
      {
        id: "msg-2",
        senderId: user?.id || "",
        senderName: user?.name || "",
        recipientId: conversation.participantId,
        content: "Sure! The session was very helpful.",
        type: "text",
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        read: true,
        conversationId: conversation.id,
      },
      {
        id: "msg-3",
        senderId: conversation.participantId,
        senderName: conversation.participantName,
        senderAvatar: conversation.participantAvatar,
        recipientId: user?.id || "",
        content: conversation.lastMessage || "Great to hear that!",
        type: "text",
        timestamp: conversation.lastMessageTime || new Date().toISOString(),
        read: false,
        conversationId: conversation.id,
      },
    ];

    setMessages(mockMessages);

    // Mark conversation as read
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv,
      ),
    );

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.picture,
      recipientId: selectedConversation.participantId,
      content: newMessage.trim(),
      type: "text",
      timestamp: new Date().toISOString(),
      read: true,
      conversationId: selectedConversation.id,
    };

    // Add message to local state
    setMessages((prev) => [...prev, message]);

    // Update conversation
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
            }
          : conv,
      ),
    );

    // Send via WebSocket (in real app)
    websocketService.sendMessage(
      selectedConversation.participantId,
      message.content,
      selectedConversation.id,
    );

    setNewMessage("");

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "coach":
        return "bg-blue-100 text-blue-800";
      case "company_admin":
        return "bg-purple-100 text-purple-800";
      case "team_member":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Messages
                  {isConnected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-50 border-r-2 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={conversation.participantAvatar} />
                          <AvatarFallback>
                            {conversation.participantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold truncate">
                            {conversation.participantName}
                          </h4>
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <Badge
                          className={`text-xs mt-1 ${getRoleBadgeColor(
                            conversation.participantRole,
                          )}`}
                        >
                          {conversation.participantRole.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={selectedConversation.participantAvatar}
                          />
                          <AvatarFallback>
                            {selectedConversation.participantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {selectedConversation.participantName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="flex-1 p-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
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
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.id
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
