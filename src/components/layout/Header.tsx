import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/ui/logo";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  Shield,
  Users,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { websocketService, Notification } from "@/services/websocket";
import { useSyncStatus } from "@/hooks/useCrossBrowserSync";

interface HeaderProps {
  userType?: "platform_admin" | "company_admin" | "coach";
}

const Header = ({ userType: propUserType }: HeaderProps) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const syncStatus = useSyncStatus();

  // Use auth context user type if available, otherwise fall back to prop
  const userType = user?.userType || propUserType || "company_admin";

  // WebSocket connection and notifications
  useEffect(() => {
    if (user && isAuthenticated) {
      // Connect to WebSocket for real-time notifications
      websocketService.simulateConnection(user.id);

      // Subscribe to connection status
      const unsubscribeConnection =
        websocketService.onConnectionChange(setIsConnected);

      // Subscribe to notifications
      const unsubscribeNotifications = websocketService.onNotification(
        (notification) => {
          setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
        },
      );

      return () => {
        unsubscribeConnection();
        unsubscribeNotifications();
      };
    }
  }, [user, isAuthenticated]);

  const isActive = (path: string) => location.pathname === path;

  const getDashboardPath = (userType: string) => {
    switch (userType) {
      case "platform_admin":
        return "/platform-admin";
      case "coach":
        return "/coach/dashboard";
      case "team_member":
        return "/team-member/dashboard";
      case "company_admin":
      default:
        return "/dashboard";
    }
  };

  const navigationItems = [
    {
      label: userType === "platform_admin" ? "Platform Dashboard" : "Dashboard",
      path: getDashboardPath(userType),
      roles: ["company_admin", "coach", "platform_admin", "team_member"],
    },
    {
      label: "New Program",
      path: "/coaching/new",
      roles: ["company_admin"],
    },
    {
      label: "Coaches",
      path: "/coaches",
      roles: ["company_admin", "platform_admin"],
    },
    {
      label: "Connections",
      path: "/connections",
      roles: ["company_admin", "coach"],
    },
    {
      label: "Messages",
      path: "/messages",
      roles: ["company_admin", "coach", "team_member", "platform_admin"],
    },
    {
      label: "Analytics",
      path: "/analytics",
      roles: ["company_admin", "platform_admin"],
    },
  ];

  // Only show navigation if user is authenticated
  const filteredItems = user
    ? navigationItems.filter((item) => item.roles.includes(userType))
    : [];

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.name) {
      const nameParts = user.name.split(" ");
      return nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : nameParts[0].substring(0, 2).toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : "U";
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <Logo size="md" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(item.path) ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={() => {
                  // For now, navigate to coaches page as a search destination
                  // This could be enhanced with a search modal later
                  const searchPath =
                    userType === "platform_admin"
                      ? "/platform-admin"
                      : "/coaches";
                  window.location.href = searchPath;
                }}
                title="Search coaches and programs"
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {notifications.filter((n) => !n.read).length > 9
                          ? "9+"
                          : notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                    {isConnected && (
                      <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-green-500"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-between p-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true })),
                        )
                      }
                    >
                      Mark all read
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n.id === notification.id
                                  ? { ...n, read: true }
                                  : n,
                              ),
                            );
                            websocketService.markNotificationAsRead(
                              notification.id,
                            );
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.read
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  notification.timestamp,
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t">
                    <Link to="/messages">
                      <Button variant="ghost" size="sm" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View all messages
                      </Button>
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cross-browser Sync Status (for platform admins) */}
              {user?.userType === "platform_admin" &&
                syncStatus.activeChannels.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-green-600 font-medium">
                      Sync ({syncStatus.activeChannels.length})
                    </span>
                  </div>
                )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          user?.picture ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || user?.email}`
                        }
                      />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  {/* User Info */}
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user?.name || "User"}</p>
                        {userType === "platform_admin" ? (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Platform Admin
                          </Badge>
                        ) : userType === "company_admin" ? (
                          <Badge variant="default" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Company Admin
                          </Badge>
                        ) : userType === "coach" ? (
                          <Badge variant="outline" className="text-xs">
                            Coach
                          </Badge>
                        ) : userType === "team_member" ? (
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            Team Member
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Enterprise
                          </Badge>
                        )}
                      </div>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.provider && user.provider !== "email" && (
                        <p className="text-xs text-muted-foreground">
                          via{" "}
                          {user.provider === "google" ? "Google" : "Microsoft"}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Not authenticated - show public navigation and auth buttons */
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  to="/invitations"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive("/invitations")
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Check Invitations
                </Link>
                <Link
                  to="/pricing"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive("/pricing")
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Pricing
                </Link>
                <Link
                  to="/coaches"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive("/coaches")
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Find Coaches
                </Link>
              </nav>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
