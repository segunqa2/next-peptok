import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface CSVUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersAdded: (users: any[]) => void;
}

interface ParsedUser {
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  company?: string;
  role?: string;
  status: "valid" | "error" | "duplicate";
  errors?: string[];
}

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

export function CSVUserUpload({
  isOpen,
  onClose,
  onUsersAdded,
}: CSVUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<
    "upload" | "preview" | "processing" | "complete"
  >("upload");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    parseCSVFile(file);
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      // Validate required headers
      const requiredHeaders = ["firstName", "lastName", "email", "userType"];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );

      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
        return;
      }

      const users: ParsedUser[] = [];
      const existingEmails = new Set();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const user: ParsedUser = {
          firstName: "",
          lastName: "",
          email: "",
          userType: "",
          status: "valid",
          errors: [],
        };

        headers.forEach((header, index) => {
          switch (header) {
            case "firstName":
              user.firstName = values[index] || "";
              break;
            case "lastName":
              user.lastName = values[index] || "";
              break;
            case "email":
              user.email = values[index] || "";
              break;
            case "userType":
              user.userType = values[index] || "";
              break;
            case "company":
              user.company = values[index] || "";
              break;
            case "role":
              user.role = values[index] || "";
              break;
          }
        });

        // Validate user data
        const errors: string[] = [];

        if (!user.firstName) errors.push("First name is required");
        if (!user.lastName) errors.push("Last name is required");
        if (!user.email) errors.push("Email is required");
        else if (!user.email.includes("@")) errors.push("Invalid email format");

        if (!user.userType) errors.push("User type is required");
        else if (
          !["platform_admin", "company_admin", "coach", "team_member"].includes(
            user.userType,
          )
        ) {
          errors.push("Invalid user type");
        }

        // Check for duplicates
        if (existingEmails.has(user.email)) {
          errors.push("Duplicate email in file");
        }
        existingEmails.add(user.email);

        if (errors.length > 0) {
          user.status = "error";
          user.errors = errors;
        }

        users.push(user);
      }

      setParsedUsers(users);
      setStep("preview");
    };

    reader.readAsText(file);
  };

  const processUpload = async () => {
    setIsProcessing(true);
    setStep("processing");

    const validUsers = parsedUsers.filter((user) => user.status === "valid");
    const total = validUsers.length;
    let processed = 0;
    let successful = 0;
    let failed = 0;

    setUploadProgress({
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      percentage: 0,
    });

    // Simulate processing each user
    for (const user of validUsers) {
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Mock success/failure (90% success rate)
        const success = Math.random() > 0.1;

        if (success) {
          successful++;
        } else {
          failed++;
          user.status = "error";
          user.errors = ["Failed to create user account"];
        }
      } catch (error) {
        failed++;
        user.status = "error";
        user.errors = ["Unexpected error occurred"];
      }

      processed++;
      const percentage = Math.round((processed / total) * 100);

      setUploadProgress({
        total,
        processed,
        successful,
        failed,
        percentage,
      });
    }

    // Notify parent component of successful users
    const successfulUsers = parsedUsers.filter(
      (user) => user.status === "valid" && !user.errors,
    );
    onUsersAdded(successfulUsers);

    setIsProcessing(false);
    setStep("complete");

    if (successful > 0) {
      toast.success(`Successfully created ${successful} user accounts`);
    }
    if (failed > 0) {
      toast.error(`Failed to create ${failed} user accounts`);
    }
  };

  const downloadTemplate = () => {
    const template = `firstName,lastName,email,userType,company,role
John,Doe,john.doe@example.com,company_admin,Acme Corp,Manager
Jane,Smith,jane.smith@example.com,coach,Executive Coaching,Senior Coach
Bob,Johnson,bob.johnson@example.com,team_member,Acme Corp,Developer`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setParsedUsers([]);
    setUploadProgress(null);
    setIsProcessing(false);
    setStep("upload");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const validCount = parsedUsers.filter((u) => u.status === "valid").length;
  const errorCount = parsedUsers.filter((u) => u.status === "error").length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Users from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple user accounts at once
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-4">
                Select a CSV file containing user data to import
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="max-w-xs mx-auto"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Required CSV Format:</h4>
              <p className="text-sm text-gray-600 mb-3">
                Your CSV file must include these columns: firstName, lastName,
                email, userType
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Optional columns: company, role
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Valid userTypes: platform_admin, company_admin, coach,
                team_member
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Preview Import Data</h3>
                <p className="text-sm text-gray-600">
                  Review the parsed data before importing
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {validCount} Valid
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {errorCount} Errors
                  </Badge>
                )}
              </div>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{getStatusIcon(user.status)}</TableCell>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.userType}</TableCell>
                      <TableCell>{user.company || "-"}</TableCell>
                      <TableCell>
                        {user.errors && user.errors.length > 0 && (
                          <div className="text-sm text-red-600">
                            {user.errors.join(", ")}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={processUpload} disabled={validCount === 0}>
                Import {validCount} Users
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && uploadProgress && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Processing Import</h3>
              <p className="text-gray-600">
                Creating user accounts... Please wait.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>
                    {uploadProgress.processed} of {uploadProgress.total}
                  </span>
                </div>
                <Progress value={uploadProgress.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadProgress.processed}
                  </div>
                  <div className="text-sm text-gray-600">Processed</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadProgress.successful}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadProgress.failed}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "complete" && uploadProgress && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
              <p className="text-gray-600">User import process has finished</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {uploadProgress.successful}
                </div>
                <div className="text-sm text-gray-600">Users Created</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-600">
                  {uploadProgress.failed}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
