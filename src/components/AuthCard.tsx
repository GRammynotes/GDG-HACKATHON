import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, User, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import logo from "@/assets/ainstein-logo.jpg";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";

type AuthMode = "login" | "register";

const generateUsername = (name: string): string => {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, "");
  const suffix = Math.random().toString(36).substring(2, 5);
  return `${cleanName}_${suffix}`;
};

export const AuthCard = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Form states
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    username: "",
  });

  useEffect(() => {
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
    setIsLoaded(false);

    try {
      if (mode === "login") {
        let emailToSignIn = loginData.identifier;

        // Check if identifier is an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.identifier);

        if (!isEmail) {
          // If not email, assume username and lookup
          const q = query(collection(db, "users"), where("username", "==", loginData.identifier.toLowerCase()));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw { code: 'auth/user-not-found' }; // Simulated error for consistency
          }

          emailToSignIn = querySnapshot.docs[0].data().email;
        }

        await signInWithEmailAndPassword(auth, emailToSignIn, loginData.password);
        toast.success("Welcome back!", {
          description: "Successfully logged in.",
        });
        navigate("/landing");
      } else {
        // Check if username exists
        const q = query(collection(db, "users"), where("username", "==", registerData.username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast.error("Username taken", {
            description: "Please choose a different username."
          });
          setIsLoaded(true);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);

        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: registerData.fullName
          });

          // Store user data in Firestore
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            username: registerData.username,
            email: registerData.email,
            fullName: registerData.fullName,
            createdAt: new Date()
          });
        }

        toast.success("Account created!", {
          description: "Welcome to AI-nsteiN CREW.",
        });
        navigate("/landing");
      }
    } catch (error: any) {
      console.error("Auth error:", error);

      let title = "Authentication failed";
      let description = "Please check your credentials and try again.";

      if (error.code === 'auth/invalid-email') {
        description = "Please enter a valid email address.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        title = "Account already exists";
        description = "This email is already registered. Please login instead.";
      } else if (error.code === 'auth/weak-password') {
        title = "Weak password";
        description = "Password should be at least 6 characters.";
      } else if (error.code === 'permission-denied') {
        title = "Database Access Denied";
        description = "Public read access to 'users' collection is required for username checks. Please update Firestore Rules.";
      } else {
        // Show the actual error message for debugging
        description = error.message || "An unexpected error occurred.";
      }

      toast.error(title, {
        description,
      });
    } finally {
      setIsLoaded(true);
    }
  };

  return (
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
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-ai-blue/5 via-transparent to-ai-purple/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="relative mb-6 group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal opacity-50 blur-xl animate-pulse-glow" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden logo-glow transition-transform duration-300 group-hover:scale-105">
              <img
                src={logo}
                alt="AI-nsteiN CREW"
                className="w-full h-full object-cover"
              />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-ai-amber animate-float" />
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
                  ? "bg-gradient-to-r from-ai-blue to-ai-purple text-foreground shadow-lg"
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
                    type="text"
                    placeholder="Email or Username"
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
                  className="text-sm text-ai-blue hover:text-ai-teal transition-colors"
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
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ai-blue/10 border border-ai-blue/20">
                    <span className="text-xs text-muted-foreground">Username:</span>
                    <span className="text-sm font-mono text-ai-blue">@{registerData.username}</span>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
            <button type="submit" className="btn-gradient w-full mt-6">
              {mode === "login" ? "Continue" : "Create Account & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
