import { Outlet, Navigate, useLocation } from "react-router-dom";
import { SiteNav } from "@/components/SiteNav";
import { useUser } from "@/lib/user-context";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col relative bg-[#0a0a0a] text-foreground">
      
      <SiteNav />
      
      <div className="flex-1 relative z-10 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
