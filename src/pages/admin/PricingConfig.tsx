import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  DollarSign,
  Users,
  TrendingUp,
  Save,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { apiEnhanced } from "@/services/apiEnhanced";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { validatePricingConfiguration } from "@/utils/validatePricingConfig";
import { usePricingConfigSync } from "@/hooks/useCrossBrowserSync";

interface PricingConfiguration {
  companyServiceFee: number;
  coachCommission: number;
  minCoachCommissionAmount: number;
  additionalParticipantFee: number;
  maxParticipantsIncluded: number;
  currency: string;
  lastUpdated: string;
}

export default function PricingConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<PricingConfiguration>({
    companyServiceFee: 0.1,
    coachCommission: 0.2,
    minCoachCommissionAmount: 5,
    additionalParticipantFee: 25,
    maxParticipantsIncluded: 1,
    currency: "CAD",
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [storageSource, setStorageSource] = useState<"backend" | "local">(
    "local",
  );
  const hasChangesRef = useRef(false);

  useEffect(() => {
    fetchPricingConfig();

    // Listen for GLOBAL configuration updates from ALL admin sessions
    const handleGlobalConfigUpdate = (event: CustomEvent) => {
      const updatedConfig = event.detail;
      setConfig(updatedConfig);
      setLastSyncTime(new Date().toLocaleString());
      setStorageSource("local"); // Simulated backend
      toast.info(
        `Configuration updated by ${updatedConfig.updatedByName || "another admin"}`,
      );
    };

    const handleConfigUpdate = (event: CustomEvent) => {
      const updatedConfig = event.detail;
      setConfig(updatedConfig);
      setLastSyncTime(new Date().toLocaleString());
      toast.info("Pricing configuration updated by another admin");
    };

    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail.type === "pricing") {
        setConfig(event.detail.settings);
        setLastSyncTime(new Date().toLocaleString());
        toast.info("Platform settings synchronized");
      }
    };

    // Set up cross-browser synchronization
    let broadcastChannel: BroadcastChannel | null = null;

    // BroadcastChannel for same-origin communication across browsers
    if (typeof BroadcastChannel !== "undefined") {
      broadcastChannel = new BroadcastChannel("peptok_config_sync");
      broadcastChannel.addEventListener("message", (event) => {
        if (event.data.type === "config_updated") {
          const updatedConfig = event.data.config;
          setConfig(updatedConfig);
          setLastSyncTime(new Date().toLocaleString());
          toast.info(
            `Configuration updated by ${updatedConfig.updatedByName || "another admin"} in different browser`,
          );
        }
      });
    }

    // Periodic sync disabled to prevent page reloads
    // Cross-browser sync is handled via BroadcastChannel and custom events
    // const syncInterval = setInterval(() => {
    //   if (hasChangesRef.current) {
    //     return;
    //   }
    //   fetchPricingConfig()
    //     .then(() => {
    //       setLastSyncTime(new Date().toLocaleString());
    //     })
    //     .catch(() => {
    //       // Ignore errors in background sync
    //     });
    // }, 5000);

    window.addEventListener(
      "globalConfigUpdated",
      handleGlobalConfigUpdate as EventListener,
    );
    window.addEventListener(
      "platformConfigUpdated",
      handleConfigUpdate as EventListener,
    );
    window.addEventListener(
      "platformSettingsUpdated",
      handleSettingsUpdate as EventListener,
    );

    return () => {
      // clearInterval(syncInterval); // No longer needed - interval disabled
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      window.removeEventListener(
        "globalConfigUpdated",
        handleGlobalConfigUpdate as EventListener,
      );
      window.removeEventListener(
        "platformConfigUpdated",
        handleConfigUpdate as EventListener,
      );
      window.removeEventListener(
        "platformSettingsUpdated",
        handleSettingsUpdate as EventListener,
      );
    };
  }, []);

  const fetchPricingConfig = async () => {
    try {
      setLoading(true);
      const pricingConfig = await apiEnhanced.getPricingConfig();
      setConfig(pricingConfig);
      setHasChanges(false);
      hasChangesRef.current = false;
      setLastSyncTime(new Date().toLocaleString());

      // Determine storage source based on API response
      setStorageSource(pricingConfig.version ? "local" : "backend");
    } catch (error) {
      console.error("Failed to fetch pricing config:", error);
      toast.error("Failed to load pricing configuration");
      setStorageSource("local");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (
    field: keyof PricingConfiguration,
    value: any,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    hasChangesRef.current = true;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await apiEnhanced.updatePricingConfig({
        ...config,
        lastUpdated: new Date().toISOString(),
      });

      setConfig(result);
      setHasChanges(false);
      hasChangesRef.current = false;
      setLastSyncTime(new Date().toLocaleString());

      // Provide feedback based on storage location
      if (result.version) {
        toast.success(
          "Pricing configuration saved to centralized platform storage",
        );
        setStorageSource("local");
      } else {
        toast.success("Pricing configuration saved to backend database");
        setStorageSource("backend");
      }
    } catch (error) {
      console.error("Failed to save pricing config:", error);
      toast.error("Failed to save pricing configuration");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      companyServiceFee: 0.1,
      coachCommission: 0.2,
      minCoachCommissionAmount: 5,
      additionalParticipantFee: 25,
      maxParticipantsIncluded: 1,
      currency: "CAD",
      lastUpdated: new Date().toISOString(),
    });
    setHasChanges(true);
    hasChangesRef.current = true;
  };

  if (user?.userType !== "platform_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Only platform administrators can access pricing configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading pricing configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-blue-600" />
                  Pricing Configuration
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage platform pricing structure and commission rates
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    storageSource === "backend" ? "default" : "secondary"
                  }
                  className={
                    storageSource === "backend"
                      ? "text-green-700 bg-green-100"
                      : "text-blue-700 bg-blue-100"
                  }
                >
                  {storageSource === "backend"
                    ? "Backend DB"
                    : "Platform Storage"}
                </Badge>
                {hasChanges && (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-200"
                  >
                    Unsaved Changes
                  </Badge>
                )}
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  disabled={saving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges || saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={() => {
                    const result = validatePricingConfiguration();
                    toast.success(
                      `Validation complete: ${result.configExists ? "Config found" : "No config"}, Performance: ${result.performanceMs.toFixed(2)}ms`,
                    );
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Test System
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Company Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Company Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyServiceFee">
                    Service Fee Percentage
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="companyServiceFee"
                      type="number"
                      min="0"
                      max="50"
                      step="0.01"
                      value={(config.companyServiceFee * 100).toFixed(2)}
                      onChange={(e) =>
                        handleConfigChange(
                          "companyServiceFee",
                          parseFloat(e.target.value) / 100,
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-8">%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Percentage charged to companies on top of coach rates and
                    additional participant fees
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalParticipantFee">
                    Additional Participant Fee
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-8">
                      {config.currency}$
                    </span>
                    <Input
                      id="additionalParticipantFee"
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={config.additionalParticipantFee}
                      onChange={(e) =>
                        handleConfigChange(
                          "additionalParticipantFee",
                          parseFloat(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Fee charged per additional participant beyond the included
                    participants
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipantsIncluded">
                    Participants Included in Base Price
                  </Label>
                  <Input
                    id="maxParticipantsIncluded"
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={config.maxParticipantsIncluded}
                    onChange={(e) =>
                      handleConfigChange(
                        "maxParticipantsIncluded",
                        parseInt(e.target.value),
                      )
                    }
                    className="flex-1"
                  />
                  <p className="text-sm text-gray-600">
                    Number of participants included in base session price.
                    Additional fees apply beyond this count.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Company Pricing Example
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Coach Rate: $150/hour</div>
                    <div>
                      {config.maxParticipantsIncluded + 2} Participants (
                      {Math.max(
                        0,
                        config.maxParticipantsIncluded +
                          2 -
                          config.maxParticipantsIncluded,
                      )}{" "}
                      additional):{" "}
                      {Math.max(
                        0,
                        config.maxParticipantsIncluded +
                          2 -
                          config.maxParticipantsIncluded,
                      )}{" "}
                      × ${config.additionalParticipantFee} = $
                      {Math.max(
                        0,
                        config.maxParticipantsIncluded +
                          2 -
                          config.maxParticipantsIncluded,
                      ) * config.additionalParticipantFee}
                    </div>
                    <div>
                      Subtotal: $150 + $
                      {Math.max(
                        0,
                        config.maxParticipantsIncluded +
                          2 -
                          config.maxParticipantsIncluded,
                      ) * config.additionalParticipantFee}{" "}
                      = $
                      {150 +
                        Math.max(
                          0,
                          config.maxParticipantsIncluded +
                            2 -
                            config.maxParticipantsIncluded,
                        ) *
                          config.additionalParticipantFee}
                    </div>
                    <div>
                      Service Fee ({(config.companyServiceFee * 100).toFixed(1)}
                      %): $
                      {(
                        (150 +
                          Math.max(
                            0,
                            config.maxParticipantsIncluded +
                              2 -
                              config.maxParticipantsIncluded,
                          ) *
                            config.additionalParticipantFee) *
                        config.companyServiceFee
                      ).toFixed(2)}
                    </div>
                    <div className="font-semibold border-t border-blue-300 pt-1 mt-2">
                      Total: $
                      {(
                        150 +
                        Math.max(
                          0,
                          config.maxParticipantsIncluded +
                            2 -
                            config.maxParticipantsIncluded,
                        ) *
                          config.additionalParticipantFee +
                        (150 +
                          Math.max(
                            0,
                            config.maxParticipantsIncluded +
                              2 -
                              config.maxParticipantsIncluded,
                          ) *
                            config.additionalParticipantFee) *
                          config.companyServiceFee
                      ).toFixed(2)}{" "}
                      {config.currency}
                    </div>
                    <div className="text-xs text-blue-600 mt-2 pt-1 border-t border-blue-300">
                      Note: Coaches earn session rate only. Additional
                      participant fees are platform charges.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coach Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Coach Commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="coachCommission">Commission Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="coachCommission"
                      type="number"
                      min="0"
                      max="50"
                      step="0.01"
                      value={(config.coachCommission * 100).toFixed(2)}
                      onChange={(e) =>
                        handleConfigChange(
                          "coachCommission",
                          parseFloat(e.target.value) / 100,
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-8">%</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Percentage of session revenue retained as platform
                    commission from coaches
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCoachCommissionAmount">
                    Minimum Commission Amount
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-8">
                      {config.currency}$
                    </span>
                    <Input
                      id="minCoachCommissionAmount"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={config.minCoachCommissionAmount}
                      onChange={(e) =>
                        handleConfigChange(
                          "minCoachCommissionAmount",
                          parseFloat(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Minimum commission amount per session, regardless of
                    percentage calculation
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    type="text"
                    value={config.currency}
                    onChange={(e) =>
                      handleConfigChange("currency", e.target.value)
                    }
                    className="flex-1"
                    placeholder="CAD"
                  />
                  <p className="text-sm text-gray-600">
                    Primary currency for all platform transactions
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Coach Earnings Example
                  </h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <div>Session Revenue: $150/hour</div>
                    <div>
                      Percentage Commission (
                      {(config.coachCommission * 100).toFixed(1)}%): $
                      {(150 * config.coachCommission).toFixed(2)}
                    </div>
                    <div>
                      Minimum Commission: ${config.minCoachCommissionAmount}
                    </div>
                    <div>
                      Actual Commission: $
                      {Math.max(
                        150 * config.coachCommission,
                        config.minCoachCommissionAmount,
                      ).toFixed(2)}
                    </div>
                    <div className="font-semibold border-t border-green-300 pt-1 mt-2">
                      Coach Earnings: $
                      {(
                        150 -
                        Math.max(
                          150 * config.coachCommission,
                          config.minCoachCommissionAmount,
                        )
                      ).toFixed(2)}{" "}
                      {config.currency}
                    </div>
                    <div className="text-xs text-green-600 mt-2 pt-1 border-t border-green-300">
                      Note: Coach earnings are per session, regardless of
                      participant count. Commission is the higher of percentage
                      or minimum amount.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Impact Summary */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Configuration Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Company Revenue Per Session
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {(config.companyServiceFee * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-700">of total session cost</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Coach Commission
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    {(config.coachCommission * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-700">
                    min ${config.minCoachCommissionAmount} {config.currency}
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    Additional Participant Fee
                  </h4>
                  <p className="text-2xl font-bold text-purple-600">
                    ${config.additionalParticipantFee}
                  </p>
                  <p className="text-sm text-purple-700">
                    after {config.maxParticipantsIncluded} participant
                    {config.maxParticipantsIncluded !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Platform-Wide Implementation
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-900">
                        Active Components
                      </div>
                      <div className="text-green-700">
                        • Pricing Calculator
                        <br />
                        • Mentorship Request Costs
                        <br />
                        • Session Management
                        <br />• Coach Earnings Display
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="font-semibold text-blue-900">
                        Usage Impact
                      </div>
                      <div className="text-blue-700">
                        • All company cost estimates
                        <br />
                        • Coach commission calculations
                        <br />
                        • Session pricing displays
                        <br />• Revenue tracking
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <div className="space-y-2">
                    <p>
                      Last updated:{" "}
                      {new Date(config.lastUpdated).toLocaleString()}
                    </p>
                    {lastSyncTime && (
                      <p className="text-xs text-green-600">
                        Last synchronized: {lastSyncTime}
                      </p>
                    )}
                    <div className="flex justify-center items-center gap-2 text-xs">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${storageSource === "backend" ? "bg-green-500" : "bg-blue-500"}`}
                      ></span>
                      <span>
                        {storageSource === "backend"
                          ? "Stored in backend database - shared across all admins"
                          : "Stored in centralized platform storage - accessible to all platform admins"}
                      </span>
                    </div>
                    <div className="flex justify-center items-center gap-2 text-xs mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="text-orange-600">
                        Cross-browser sync active - Changes visible in different
                        browsers
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Changes will be reflected across
                      all pricing displays and calculations immediately after
                      saving.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
