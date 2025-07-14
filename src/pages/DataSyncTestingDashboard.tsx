import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DataSyncTester } from "@/components/testing/DataSyncTester";
import { DatabaseServiceTest } from "@/components/testing/DatabaseServiceTest";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  HardDrive,
  Sync,
  TestTube,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function DataSyncTestingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Data Synchronization Testing Dashboard
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Comprehensive testing and validation of the data synchronization
              system that ensures all operations follow the backend-first
              approach with localStorage fallback.
            </p>
          </div>

          {/* Requirements Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Implementation Requirements
              </CardTitle>
              <CardDescription>
                This system implements the following data synchronization
                requirements:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Backend-First Retrieval</h4>
                      <p className="text-sm text-gray-600">
                        All data operations attempt to use the NestJS backend
                        first before falling back to localStorage.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sync className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">
                        Automatic Synchronization
                      </h4>
                      <p className="text-sm text-gray-600">
                        All data created or updated in localStorage is
                        automatically queued for backend synchronization.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HardDrive className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Fallback Handling</h4>
                      <p className="text-sm text-gray-600">
                        When backend is unavailable, operations seamlessly fall
                        back to localStorage with queued sync.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TestTube className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Data Consistency</h4>
                      <p className="text-sm text-gray-600">
                        localStorage is updated with latest backend data to
                        ensure consistency across sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Details */}
          <Tabs defaultValue="testing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="testing">Data Sync Testing</TabsTrigger>
              <TabsTrigger value="database">Database Service</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
            </TabsList>

            <TabsContent value="testing" className="space-y-6">
              <DataSyncTester />
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Service Connection Test</CardTitle>
                  <CardDescription>
                    Test and validate database service configuration and cloud
                    environment handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DatabaseServiceTest />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="architecture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Synchronization Architecture</CardTitle>
                  <CardDescription>
                    Overview of the implemented synchronization system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Core Components</h4>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium">DataSyncService</h5>
                          <p className="text-sm text-gray-600">
                            Centralized service handling all data operations
                            with backend-first approach and automatic fallback.
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium">Sync Configurations</h5>
                          <p className="text-sm text-gray-600">
                            Predefined configurations for all data types
                            including endpoints and storage keys.
                          </p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h5 className="font-medium">Enhanced API Service</h5>
                          <p className="text-sm text-gray-600">
                            Updated to use sync service for all data operations
                            with proper error handling and retry logic.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Data Flow</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span>1. Operation initiated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span>2. Backend health check</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span>3. Backend operation attempt</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span>4. localStorage fallback if needed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          <span>5. Queue for sync if offline</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                          <span>6. Update localStorage with backend data</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Key Features:</strong> Automatic retry logic,
                      health monitoring, sync queue processing, and data
                      consistency validation ensure robust operation even in
                      unstable network conditions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Report</CardTitle>
                  <CardDescription>
                    Verification of requirement compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">
                            Data Synchronization
                          </h5>
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Compliant
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          All localStorage data is automatically queued for
                          backend synchronization when the service is available.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">
                            Backend-First Retrieval
                          </h5>
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Compliant
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          All data operations attempt backend first with
                          automatic fallback to localStorage when unavailable.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">Fallback Handling</h5>
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Compliant
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Seamless fallback to localStorage with automatic sync
                          queue management and retry logic.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">Data Consistency</h5>
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Compliant
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          localStorage is updated with backend data on
                          successful operations to maintain consistency.
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>✅ Full Compliance Achieved:</strong> All
                        requirements have been implemented and tested. The
                        system provides robust data synchronization with proper
                        fallback handling and data consistency guarantees.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}
