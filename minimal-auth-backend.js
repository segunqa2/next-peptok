const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);
app.use(express.json());

// Mock users
const mockUsers = [
  {
    id: "platform-admin-1",
    email: "platform@peptok.com",
    name: "Platform Admin",
    firstName: "Platform",
    lastName: "Admin",
    userType: "platform_admin",
  },
  {
    id: "company-admin-1",
    email: "admin@company.com",
    name: "Company Admin",
    firstName: "Company",
    lastName: "Admin",
    userType: "company_admin",
  },
  {
    id: "techcorp-admin-1",
    email: "admin@techcorp.com",
    name: "TechCorp Admin",
    firstName: "TechCorp",
    lastName: "Admin",
    userType: "company_admin",
  },
];

// Health endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "peptok-auth-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/platform/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Authentication endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found",
    });
  }

  // For demo, any password works
  const token = `mock_jwt_token_${user.id}_${Date.now()}`;

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
        provider: "email",
        isAuthenticated: true,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: "active",
      },
      token,
      refreshToken: `mock_refresh_token_${user.id}_${Date.now()}`,
    },
  });
});

app.post("/api/auth/register", (req, res) => {
  const userData = req.body;

  const newUser = {
    id: `user_${Date.now()}`,
    email: userData.email,
    name: `${userData.firstName} ${userData.lastName}`,
    firstName: userData.firstName,
    lastName: userData.lastName,
    userType: userData.userType || "team_member",
  };

  const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;

  res.status(201).json({
    success: true,
    data: {
      user: {
        ...newUser,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.firstName}`,
        provider: "email",
        isAuthenticated: true,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: "active",
      },
      token,
      refreshToken: `mock_refresh_token_${newUser.id}_${Date.now()}`,
    },
  });
});

app.get("/api/auth/profile", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  // For demo, return a mock user based on the token
  const user = mockUsers[0]; // Return first user for demo

  res.json({
    ...user,
    picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
    provider: "email",
    isAuthenticated: true,
    joinedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    status: "active",
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Minimal Auth Backend running on http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(
    `🔍 Platform health: http://localhost:${port}/api/platform/health`,
  );
  console.log(`🔐 Test login: admin@techcorp.com with any password`);
});
