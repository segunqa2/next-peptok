import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { apiEnhanced } from "@/services/apiEnhanced";
import { analytics } from "@/services/analytics";
import { toast } from "sonner";
import { crossBrowserSync, SYNC_CONFIGS } from "@/services/crossBrowserSync";

import {
  Users,
  Building2,
  Plus,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Shield,
  Activity,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Brain,
  Mail,
  Settings,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  userType: "platform_admin" | "company_admin" | "coach";
  status: "active" | "suspended" | "inactive";
  company?: string;
  joinedAt: string;
  lastActive: string;
  sessionsCount: number;
  revenue?: number;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  adminEmail: string;
  userCount: number;
  status: "active" | "suspended" | "trial";
  subscription: string;
  joinedAt: string;
  revenue: number;
}

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalCoaches: number;
  totalSessions: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
}

export default function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalCoaches: 0,
    totalSessions: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUserType, setFilterUserType] = useState("all");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userType: "company_admin" as const,
    company: "",
    password: "",
  });

  // New company form state
  const [newCompany, setNewCompany] = useState({
    name: "",
    industry: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    subscription: "starter",
  });

  // Redirect if not platform admin
  useEffect(() => {
    if (user && user.userType !== "platform_admin") {
      navigate("/");
      toast.error("Access denied. Platform admin privileges required.");
    }
  }, [user, navigate]);

  // Load data and initialize cross-browser sync
  useEffect(() => {
    loadPlatformData();

    // Initialize cross-browser sync for platform admin data
    crossBrowserSync.register(SYNC_CONFIGS.USER_MANAGEMENT);
    crossBrowserSync.register(SYNC_CONFIGS.COMPANY_MANAGEMENT);
    crossBrowserSync.register(SYNC_CONFIGS.PLATFORM_SETTINGS);

    // Subscribe to user management updates
    const unsubscribeUsers = crossBrowserSync.subscribe(
      "peptok_user_management",
      (data) => {
        if (data.users) {
          setUsers(data.users);
          toast.info("User data synchronized across browsers");
        }
      },
    );

    // Subscribe to company management updates
    const unsubscribeCompanies = crossBrowserSync.subscribe(
      "peptok_company_management",
      (data) => {
        if (data.companies) {
          setCompanies(data.companies);
          toast.info("Company data synchronized across browsers");
        }
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeCompanies();
    };
  }, []);

  const loadPlatformData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Track page view
      analytics.pageView({
        page: "platform_admin_dashboard",
        userId: user?.id,
        userType: user?.userType,
      });

      // Try to get data from API first
      try {
        const [platformStats, allUsers, allCompanies] = await Promise.all([
          apiEnhanced.getPlatformStats().catch(() => null),
          apiEnhanced.getAllUsers().catch(() => null),
          apiEnhanced.getAllCompanies().catch(() => null),
        ]);

        if (platformStats) setStats(platformStats);
        if (allUsers) setUsers(allUsers);
        if (allCompanies) setCompanies(allCompanies);

        // If we got some data from API, we're done
        if (platformStats || allUsers || allCompanies) {
          return;
        }
      } catch (apiError) {
        console.warn("API not available, using mock data:", apiError);
      }

      // Fallback to mock data
      const mockStats: PlatformStats = {
        totalUsers: 1247,
        totalCompanies: 89,
        totalCoaches: 156,
        totalSessions: 3842,
        monthlyRevenue: 47580,
        activeSubscriptions: 67,
      };

      const mockUsers: User[] = [
        {
          id: "user1",
          name: "Alice Johnson",
          email: "alice@techcorp.com",
          userType: "company_admin",
          status: "active",
          company: "TechCorp Inc.",
          joinedAt: "2024-01-15",
          lastActive: "2024-01-20",
          sessionsCount: 12,
          revenue: 2400,
        },
        {
          id: "user2",
          name: "Bob Smith",
          email: "bob@coaching.com",
          userType: "coach",
          status: "active",
          joinedAt: "2024-01-10",
          lastActive: "2024-01-19",
          sessionsCount: 28,
          revenue: 5600,
        },
        {
          id: "user3",
          name: "Carol Davis",
          email: "carol@startup.com",
          userType: "company_admin",
          status: "suspended",
          company: "StartupCo",
          joinedAt: "2024-01-05",
          lastActive: "2024-01-18",
          sessionsCount: 5,
          revenue: 1000,
        },
      ];

      const mockCompanies: Company[] = [
        {
          id: "comp1",
          name: "TechCorp Inc.",
          industry: "Technology",
          adminEmail: "alice@techcorp.com",
          userCount: 25,
          status: "active",
          subscription: "Growth Plan",
          joinedAt: "2024-01-15",
          revenue: 4950,
        },
        {
          id: "comp2",
          name: "StartupCo",
          industry: "Fintech",
          adminEmail: "carol@startup.com",
          userCount: 8,
          status: "trial",
          subscription: "Starter Plan",
          joinedAt: "2024-01-05",
          revenue: 792,
        },
      ];

      setStats(mockStats);
      setUsers(mockUsers);
      setCompanies(mockCompanies);
    } catch (error) {
      console.error("Error loading platform data:", error);
      setError("Failed to load platform data");
      toast.error("Failed to load platform data");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "suspended":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "inactive":
      case "trial":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "platform_admin":
        return "bg-red-100 text-red-800";
      case "company_admin":
        return "bg-blue-100 text-blue-800";
      case "coach":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, status: "suspended" as const } : u,
      );
      setUsers(updatedUsers);
      toast.success("User suspended successfully");

      analytics.trackAction({
        action: "user_suspended",
        component: "platform_admin_dashboard",
        metadata: { suspendedUserId: userId, adminId: user?.id },
      });
    } catch (error) {
      toast.error("Failed to suspend user");
      analytics.trackError(
        error instanceof Error ? error : new Error("User suspension failed"),
        { component: "platform_admin_dashboard", userId, adminId: user?.id },
      );
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, status: "active" as const } : u,
      );
      setUsers(updatedUsers);
      toast.success("User activated successfully");

      analytics.trackAction({
        action: "user_activated",
        component: "platform_admin_dashboard",
        metadata: { activatedUserId: userId, adminId: user?.id },
      });
    } catch (error) {
      toast.error("Failed to activate user");
      analytics.trackError(
        error instanceof Error ? error : new Error("User activation failed"),
        { component: "platform_admin_dashboard", userId, adminId: user?.id },
      );
    }
  };

  const handleCreateUser = async () => {
    try {
      // In real app, this would be an API call
      const user: User = {
        id: `user_${Date.now()}`,
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        userType: newUser.userType,
        status: "active",
        company: newUser.company,
        joinedAt: new Date().toISOString().split("T")[0],
        lastActive: new Date().toISOString().split("T")[0],
        sessionsCount: 0,
        revenue: 0,
      };

      const updatedUsers = [...users, user];
      setUsers(updatedUsers);

      // Sync across browsers
      crossBrowserSync.save(
        SYNC_CONFIGS.USER_MANAGEMENT,
        { users: updatedUsers },
        { id: user?.id || "admin", name: user?.name || "Platform Admin" },
      );

      // User data will be refreshed on next load

      setIsCreateUserOpen(false);
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        userType: "company_admin",
        company: "",
        password: "",
      });
      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleCreateCompany = async () => {
    try {
      // In real app, this would be an API call
      const company: Company = {
        id: `comp_${Date.now()}`,
        name: newCompany.name,
        industry: newCompany.industry,
        adminEmail: newCompany.adminEmail,
        userCount: 1,
        status: "trial",
        subscription: newCompany.subscription,
        joinedAt: new Date().toISOString().split("T")[0],
        revenue: 0,
      };

      const updatedCompanies = [...companies, company];
      setCompanies(updatedCompanies);

      // Sync across browsers
      crossBrowserSync.save(
        SYNC_CONFIGS.COMPANY_MANAGEMENT,
        { companies: updatedCompanies },
        { id: user?.id || "admin", name: user?.name || "Platform Admin" },
      );

      // Invalidate company-related cache for all users
      // Company data will be refreshed on next load

      setIsCreateCompanyOpen(false);
      setNewCompany({
        name: "",
        industry: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        subscription: "starter",
      });
      toast.success("Company created successfully");
    } catch (error) {
      toast.error("Failed to create company");
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.company &&
        user.company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    const matchesUserType =
      filterUserType === "all" || user.userType === filterUserType;

    return matchesSearch && matchesStatus && matchesUserType;
  });

  if (!user || user.userType !== "platform_admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading platform data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                onClick={loadPlatformData}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Platform Administration
              </h1>
              <p className="text-gray-600">
                Manage users, companies, and platform settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/admin/matching")}
                variant="outline"
              >
                <Brain className="w-4 h-4 mr-2" />
                Algorithm Settings
              </Button>
              <Dialog
                open={isCreateCompanyOpen}
                onOpenChange={setIsCreateCompanyOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Company</DialogTitle>
                    <DialogDescription>
                      Add a new company to the platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={newCompany.name}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={newCompany.industry}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              industry: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adminFirstName">Admin First Name</Label>
                        <Input
                          id="adminFirstName"
                          value={newCompany.adminFirstName}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              adminFirstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminLastName">Admin Last Name</Label>
                        <Input
                          id="adminLastName"
                          value={newCompany.adminLastName}
                          onChange={(e) =>
                            setNewCompany({
                              ...newCompany,
                              adminLastName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="adminEmail">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newCompany.adminEmail}
                        onChange={(e) =>
                          setNewCompany({
                            ...newCompany,
                            adminEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="subscription">Subscription Plan</Label>
                      <Select
                        value={newCompany.subscription}
                        onValueChange={(value) =>
                          setNewCompany({ ...newCompany, subscription: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter Plan</SelectItem>
                          <SelectItem value="growth">Growth Plan</SelectItem>
                          <SelectItem value="enterprise">
                            Enterprise Plan
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateCompany} className="w-full">
                      Create Company
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isCreateUserOpen}
                onOpenChange={setIsCreateUserOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newUser.firstName}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newUser.lastName}
                          onChange={(e) =>
                            setNewUser({ ...newUser, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="userType">User Type</Label>
                      <Select
                        value={newUser.userType}
                        onValueChange={(value: any) =>
                          setNewUser({ ...newUser, userType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="company_admin">
                            Company Admin
                          </SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={newUser.company}
                        onChange={(e) =>
                          setNewUser({ ...newUser, company: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Temporary Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                      />
                    </div>
                    <Button onClick={handleCreateUser} className="w-full">
                      Create User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Companies
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalCompanies || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Coaches</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalCoaches || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalSessions?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Monthly Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.monthlyRevenue?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Subs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeSubscriptions || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/pricing")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Pricing Configuration
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage platform pricing structure
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600">
                          All admins synchronized
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/platform")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Platform Settings
                      </h3>
                      <p className="text-sm text-gray-600">
                        Security, AI, and system configuration
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs text-blue-600">
                          Security & AI controls
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/analytics")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Analytics Settings
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure analytics and reporting
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                        <span className="text-xs text-purple-600">
                          Data insights & reports
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/matching")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="h-8 w-8 text-indigo-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Matching Algorithm
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure mentor-mentee matching weights
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-xs text-indigo-600">
                          AI-powered matching
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/admin/email-settings")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Email Settings
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure email service and notifications
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600">
                          EmailJS integration
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Users Management</CardTitle>
                      <CardDescription>
                        Manage platform users and their permissions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterUserType}
                      onValueChange={setFilterUserType}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="platform_admin">
                          Platform Admin
                        </SelectItem>
                        <SelectItem value="company_admin">
                          Company Admin
                        </SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getUserTypeColor(user.userType)}
                            >
                              {user.userType.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.company || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(user.status)}
                              <span className="capitalize">{user.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.sessionsCount}</TableCell>
                          <TableCell>
                            {user.revenue
                              ? `$${user.revenue.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsUserDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {user.status === "active" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleSuspendUser(user.id)}
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleActivateUser(user.id)}
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Companies Management */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Companies</CardTitle>
                  <CardDescription>Manage company accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {company.industry}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(company.status)}
                              <span className="capitalize">
                                {company.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{company.userCount}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Company
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Badge className={getUserTypeColor(selectedUser.userType)}>
                    {selectedUser.userType.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedUser.status)}
                    <span className="capitalize">{selectedUser.status}</span>
                  </div>
                </div>
                <div>
                  <Label>Company</Label>
                  <p className="font-medium">{selectedUser.company || "-"}</p>
                </div>
                <div>
                  <Label>Sessions Count</Label>
                  <p className="font-medium">{selectedUser.sessionsCount}</p>
                </div>
                <div>
                  <Label>Revenue</Label>
                  <p className="font-medium">
                    {selectedUser.revenue
                      ? `$${selectedUser.revenue.toLocaleString()}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label>Joined</Label>
                  <p className="font-medium">{selectedUser.joinedAt}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
