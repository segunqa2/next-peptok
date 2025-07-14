import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ProgramDetails } from "@/components/programs/ProgramDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProgramDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Program Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The requested program could not be found.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <ProgramDetails programId={id} onBack={() => navigate(-1)} />
      </main>

      <Footer />
    </div>
  );
};

export default ProgramDetailsPage;
