import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface UserContextValue {
  username: string;
  setUsername: (name: string) => void;
  isAuthenticated: boolean;
  login: (name: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsernameState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("north_username");
      return saved || "Guest";
    } catch {
      return "Guest";
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("north_auth") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("north_username", username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem("north_auth", isAuthenticated.toString());
  }, [isAuthenticated]);

  const setUsername = (name: string) => {
    setUsernameState(name || "Guest");
  };

  const login = (name: string) => {
    setUsername(name);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUsername("Guest");
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ username, setUsername, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};
