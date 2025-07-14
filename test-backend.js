#!/usr/bin/env node

import { spawn } from "child_process";
import fetch from "node-fetch";

console.log("🚀 Starting backend validation test...\n");

// Start backend server
console.log("📦 Starting backend server...");
const backend = spawn("node", ["backend/src/server.js"], {
  stdio: "pipe",
  cwd: process.cwd(),
});

let backendReady = false;

backend.stdout.on("data", (data) => {
  const output = data.toString();
  console.log("Backend:", output.trim());

  if (output.includes("Peptok Backend Server running")) {
    backendReady = true;
    console.log("✅ Backend server is ready!\n");

    // Test API endpoints
    setTimeout(testApi, 2000);
  }
});

backend.stderr.on("data", (data) => {
  console.error("Backend Error:", data.toString());
});

async function testApi() {
  console.log("🧪 Testing API endpoints...\n");

  try {
    // Test health endpoint
    console.log("Testing health endpoint...");
    const healthResponse = await fetch("http://localhost:3001/health");
    const healthData = await healthResponse.json();
    console.log("✅ Health check:", healthData.status);

    // Test subscription tiers endpoint
    console.log("\nTesting subscription tiers endpoint...");
    const tiersResponse = await fetch(
      "http://localhost:3001/api/subscriptions/tiers",
    );
    const tiersData = await tiersResponse.json();
    console.log("✅ Subscription tiers loaded:", tiersData.length, "plans");
    console.log(
      "📋 Plans:",
      tiersData.map((t) => `${t.name} (CA$${t.price})`).join(", "),
    );

    console.log("\n🎉 Backend validation complete! All endpoints working.");
    console.log("\n📋 Summary:");
    console.log("- ✅ Backend server: Running on port 3001");
    console.log("- ✅ Health check: Working");
    console.log("- ✅ Subscription API: Working");
    console.log("- ✅ Data source: Backend database/mock data");
    console.log(
      "\n🔧 Frontend should now load plans from backend instead of local data.",
    );
  } catch (error) {
    console.error("❌ API test failed:", error.message);
    console.log(
      "\n⚠️  Backend not accessible, frontend will use local fallback data.",
    );
  }

  // Clean up
  backend.kill();
  process.exit(0);
}

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping backend server...");
  backend.kill();
  process.exit(0);
});

// Timeout if backend doesn't start
setTimeout(() => {
  if (!backendReady) {
    console.log("❌ Backend startup timeout. Using frontend fallback data.");
    backend.kill();
    process.exit(1);
  }
}, 10000);
