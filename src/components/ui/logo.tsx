import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon-only";
}

const Logo = ({ className, size = "md", variant = "full" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/peptok-logo.png"
        alt="Peptok Logo"
        className={cn("w-auto object-contain", sizeClasses[size])}
        style={{
          maxWidth: "100px",
          height: "auto",
        }}
        loading="eager"
        decoding="async"
        onLoad={() => {
          console.log("✅ Peptok logo loaded successfully");
        }}
        onError={(e) => {
          console.error("❌ Logo image failed to load from /peptok-logo.png");
          // Try alternative path as fallback
          const target = e.target as HTMLImageElement;
          if (target.src.endsWith("/peptok-logo.png")) {
            target.src = "./peptok-logo.png";
          }
        }}
      />
    </div>
  );
};

export default Logo;
