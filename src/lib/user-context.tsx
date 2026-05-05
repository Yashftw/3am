import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { auth } from "./firebase";

interface UserContextValue {
  user: User | null;
  username: string;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (e: string, p: string) => Promise<void>;
  signup: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const username = user?.email?.split('@')[0] || "Guest";

  return (
    <UserContext.Provider value={{ 
      user, 
      username, 
      isAuthenticated: !!user, 
      isInitializing, 
      login, 
      signup, 
      logout 
    }}>
      {!isInitializing && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

