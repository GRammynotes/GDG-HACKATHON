import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!currentUser) {
        setChecking(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      setOnboardingDone(!!snap.data()?.onboardingCompleted);
      setChecking(false);
    };

    checkOnboarding();
  }, [currentUser]);

  if (loading || checking) return null;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // 🚫 If onboarding already completed, block onboarding page
  if (onboardingDone && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
