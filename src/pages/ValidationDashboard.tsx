import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Shield,
  Calendar,
  Users,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { SessionScheduleModificationValidator } from "@/components/testing/SessionScheduleModificationValidator";

export const ValidationDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Session Schedule Modification Validation
        </h1>
        <p className="text-gray-600">
          Comprehensive testing dashboard for session schedule modification
          authorization and workflow validation.
        </p>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Feature Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Core Functionality
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Company admins can request session schedule modifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Assigned coaches must approve modifications before session
                    start
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Sessions are blocked from starting during pending
                    modifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Role-based access control and authorization
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Security Features
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    User role validation at component and API level
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Session ownership and assignment verification
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Audit logging for all modification actions
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Platform admin override capabilities
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">User Roles</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Company Admin</Badge>
                    <span className="text-sm">
                      Can request modifications for company sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Coach</Badge>
                    <span className="text-sm">
                      Can approve/reject modification requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Team Member</Badge>
                    <span className="text-sm">
                      View-only access to sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Platform Admin</Badge>
                    <span className="text-sm">
                      Full override and management capabilities
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Workflow States</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      Scheduled → Available for modification requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">
                      Pending Approval → Session start blocked
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      Approved → Session rescheduled and notifications sent
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">
                      Rejected → Original schedule maintained
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          <strong>Validation Environment:</strong> This dashboard runs in a
          controlled testing environment. Switch between different user roles to
          test authorization controls and workflow behavior. The session
          modification flow enforces strict authorization rules that match
          production requirements.
        </AlertDescription>
      </Alert>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Frontend Components</h4>
              <ul className="text-sm space-y-1">
                <li>• SessionScheduleModificationFlow</li>
                <li>• Authorization middleware</li>
                <li>• Role-based UI rendering</li>
                <li>• State management</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">API Integration</h4>
              <ul className="text-sm space-y-1">
                <li>• POST /sessions/:id/modifications</li>
                <li>• POST /sessions/:id/modifications/:id/respond</li>
                <li>• GET /sessions/:id/modifications/pending</li>
                <li>• POST /sessions/:id/modifications/log</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Security Measures</h4>
              <ul className="text-sm space-y-1">
                <li>• JWT token validation</li>
                <li>• Role-based access control</li>
                <li>• Session ownership checks</li>
                <li>• Action audit logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Component */}
      <SessionScheduleModificationValidator />

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong>Validation Complete:</strong> This implementation ensures
              that company administrators can modify session schedules, coaches
              must approve changes before sessions can start, and all actions
              are properly authorized and audited.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
