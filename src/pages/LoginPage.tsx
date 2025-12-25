import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/ainstein-logo.jpg";

type AuthMode = "login" | "register";

const generateUsername = (name: string): string => {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, "");
  const suffix = Math.random().toString(36).substring(2, 5);
  return `${cleanName}_${suffix}`;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, currentUser, userData, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Form states - UI only
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    username: "",
  });

  // Redirect if already logged in (only if Firebase is configured)
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (userData?.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  }, [currentUser, userData, navigate, authLoading]);

  useEffect(() => {
    // Show form immediately, don't wait for auth loading
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate username when name changes
  useEffect(() => {
    if (registerData.fullName.length >= 2) {
      setRegisterData((prev) => ({
        ...prev,
        username: generateUsername(prev.fullName),
      }));
    }
  }, [registerData.fullName]);

  // 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "login") {
        // Login with Firebase
        await login(loginData.identifier, loginData.password);
        toast.success("Login successful!", {
          description: "Welcome back!",
        });
        // Navigation will happen via useEffect when currentUser changes
      } else {
        // Register with Firebase
        if (registerData.password.length < 6) {
          toast.error("Password too short", {
            description: "Password must be at least 6 characters",
          });
          setIsLoading(false);
          return;
        }
        await register(registerData.email, registerData.password, registerData.fullName, registerData.username);
        toast.success("Account created!", {
          description: "Redirecting to onboarding...",
        });
        navigate("/onboarding");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "An error occurred. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Authentication failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-ai-gradient flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div
        className={`w-full max-w-md transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 blur-sm"
          }`}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="glass-card gradient-border rounded-3xl p-8 transition-transform duration-300 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Shimmer overlay */}
          <div className="shimmer absolute inset-0 rounded-3xl overflow-hidden pointer-events-none opacity-20" />

          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <div className="relative mb-6 group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 opacity-50 blur-xl animate-pulse-glow" />
              <div className="relative w-24 h-24 rounded-full overflow-hidden logo-glow transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logo}
                  alt="AI-nsteiN CREW"
                  className="w-full h-full object-cover"
                />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-500 animate-float" />
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider text-foreground mb-2">
              AI-nsteiN CREW
            </h1>

            {/* Tagline */}
            <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
              Personalized study paths based on your academic goals
            </p>

            {/* Mode Toggle */}
            <div className="flex w-full bg-muted/50 rounded-xl p-1 mb-6">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${mode === m
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {mode === "login" ? (
                <>
                  {/* Login Form */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginData.identifier}
                      onChange={(e) =>
                        setLoginData({ ...loginData, identifier: e.target.value })
                      }
                      className="glass-input pl-12 text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="glass-input pl-12 pr-12 text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-sm text-blue-500 hover:text-teal-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </>
              ) : (
                <>
                  {/* Register Form */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={registerData.fullName}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, fullName: e.target.value })
                      }
                      className="glass-input pl-12 text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>

                  {registerData.username && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-xs text-muted-foreground">Username:</span>
                      <span className="text-sm font-mono text-blue-500">@{registerData.username}</span>
                    </div>
                  )}

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, email: e.target.value })
                      }
                      className="glass-input pl-12 text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, password: e.target.value })
                      }
                      className="glass-input pl-12 pr-12 text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-gradient w-full mt-6"
                disabled={isLoading}
              >
                {isLoading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Continue"
                    : "Create Account & Continue"
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;

