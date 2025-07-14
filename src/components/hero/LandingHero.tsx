import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const LandingHero = () => {
  return (
    <section className="relative py-12 md:py-20 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Connect with
                <span className="text-primary"> Retired Experts</span> for
                <span className="text-primary"> Enterprise Growth</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Peptok bridges the gap between your enterprises and seasoned
                professionals, creating meaningful coaching connections that
                drive measurable business outcomes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  500+
                </div>
                <div className="text-sm text-muted-foreground">
                  Expert Coaches
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  10k+
                </div>
                <div className="text-sm text-muted-foreground">
                  Connections Made
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  95%
                </div>
                <div className="text-sm text-muted-foreground">
                  Success Rate
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative z-10 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-2xl p-8">
              <div className="space-y-6">
                {/* Coach Cards Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20"></div>
                      <div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded mt-1"></div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/30"></div>
                      <div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded mt-1"></div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Feature Icons */}
                <div className="flex justify-center space-x-8 pt-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Coach Network
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Goal Tracking
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Success Metrics
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-primary/10"></div>
            <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-secondary/20"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
