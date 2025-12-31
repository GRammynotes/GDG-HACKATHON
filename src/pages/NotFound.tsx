import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-ai-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="glass-card gradient-border w-full max-w-md p-8 text-center relative">
        <div className="space-y-6">
          {/* Error Code */}
          <div className="space-y-2">
            <p className="text-6xl font-display font-bold text-gradient">404</p>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Page Not Found
            </h1>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-gradient w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/")}
              className="glass-input w-full py-3 text-foreground hover:bg-white/10 transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
