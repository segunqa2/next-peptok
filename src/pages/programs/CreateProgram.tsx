import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProgramCreationForm } from "@/components/programs/ProgramCreationForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CreateProgram: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (programId: string) => {
    navigate(`/programs/${programId}`, {
      state: { message: "Program created successfully!" },
    });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Program</h1>
            <p className="text-muted-foreground">
              Design a comprehensive coaching program for your team
            </p>
          </div>
        </div>

        {/* Form */}
        <ProgramCreationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </main>

      <Footer />
    </div>
  );
};

export default CreateProgram;
