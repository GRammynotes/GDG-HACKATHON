import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  userData: any;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Listen to auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🔄 Manual refresh (used after profile edits)
  const refreshUserData = async () => {
    if (!auth.currentUser) return;

    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setUserData(docSnap.data());
    }
  };

  // 🔐 Login (email OR username)
  const login = async (identifier: string, password: string) => {
    let emailToSignIn = identifier;

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (!isEmail) {
      const q = query(
        collection(db, "users"),
        where("username", "==", identifier.toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("User not found");
      }

      emailToSignIn = querySnapshot.docs[0].data().email;
    }

    await signInWithEmailAndPassword(auth, emailToSignIn, password);
  };

  // 📝 Register with local storage fallback
  const register = async (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => {
    // Check username availability
    let usernameAvailable = true;
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        usernameAvailable = false;
      }
    } catch (error) {
      console.warn("Could not check username availability, will try anyway:", error);
    }

    if (!usernameAvailable) {
      throw new Error("Username already taken");
    }

    try {
      // Try Firebase registration
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: fullName });

      try {
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          email,
          fullName,
          username: username.toLowerCase(),
          createdAt: new Date(),
          onboardingCompleted: false,
        });
      } catch (firestoreError) {
        console.error("Firestore save failed, saving to local storage:", firestoreError);
        // Fallback: Save to local storage
        const localUserData = {
          uid: res.user.uid,
          email,
          fullName,
          username: username.toLowerCase(),
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
          savedLocally: true,
        };
        localStorage.setItem(`user_${res.user.uid}`, JSON.stringify(localUserData));

        // Try to sync to Firestore later
        setTimeout(async () => {
          try {
            await setDoc(doc(db, "users", res.user.uid), localUserData, { merge: true });
            localStorage.removeItem(`user_${res.user.uid}`);
          } catch (retryError) {
            console.warn("Retry sync failed:", retryError);
          }
        }, 5000);
      }
    } catch (error: any) {
      // If Firebase auth fails, store registration attempt locally
      if (error.code?.startsWith("auth/")) {
        console.error("Firebase auth error:", error);
        throw error; // Re-throw Firebase auth errors
      }

      // For other errors, save to local storage as fallback
      console.warn("Registration failed, saving to local storage:", error);
      const localRegistration = {
        email,
        fullName,
        username: username.toLowerCase(),
        password: btoa(password), // Basic encoding (not secure, but for verification)
        createdAt: new Date().toISOString(),
        pending: true,
      };

      const existingPending = JSON.parse(localStorage.getItem("pending_registrations") || "[]");
      existingPending.push(localRegistration);
      localStorage.setItem("pending_registrations", JSON.stringify(existingPending));

      throw new Error("Registration failed. Your details have been saved locally. Please try again later.");
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    register,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
