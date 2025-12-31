import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [hasAimProfile, setHasAimProfile] = useState(false);

  useEffect(() => {
    const checkAimProfile = async () => {
      if (!currentUser) {
        setChecking(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      setHasAimProfile(!!snap.data()?.academicProfile);
      setChecking(false);
    };

    checkAimProfile();
  }, [currentUser]);

  if (loading || checking) return null;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }



  return children;
};

export default ProtectedRoute;
