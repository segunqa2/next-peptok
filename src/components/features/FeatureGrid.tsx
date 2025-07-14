import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  Shield,
  Search,
  BarChart3,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Expert Network",
    description:
      "Access to a curated network of retired industry experts and leaders with proven track records.",
  },
  {
    icon: MessageSquare,
    title: "Secure Communication",
    description:
      "Built-in messaging and video calling platform for seamless coach-client interactions.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Comprehensive analytics to track engagement, progress, and ROI of coaching programs.",
  },
  {
    icon: BookOpen,
    title: "Learning Resources",
    description:
      "Access to curated learning materials and resources shared by expert coaches.",
  },
  {
    icon: TrendingUp,
    title: "Success Tracking",
    description:
      "Real-time tracking of key performance indicators and success metrics.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Enterprise-grade security with SSO integration and data protection compliance.",
  },
];

const FeatureGrid = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need for
            <span className="text-primary"> successful coaching</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Peptok provides all the tools and features necessary to build,
            manage, and measure effective coaching programs at enterprise scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
