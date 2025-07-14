import { Link } from "react-router-dom";
import Logo from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting enterprises with retired experts for meaningful
              coaching and growth.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/coaches" className="hover:text-primary">
                  Coach Directory
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-primary">
                  Analytics
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  About (Coming Soon)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  Careers (Coming Soon)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  Contact (Coming Soon)
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  Blog (Coming Soon)
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  Help Center (Coming Soon)
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary text-muted-foreground/70 cursor-not-allowed"
                >
                  Security (Coming Soon)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Peptok. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
