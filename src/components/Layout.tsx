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
    <div className="min-h-screen flex flex-col relative">
      {/* Global Mountain to Grid Transition Background */}
      <div 
        className="absolute inset-0 bg-[url('/mountain-bg.jpg')] bg-cover bg-center bg-fixed opacity-30 mix-blend-luminosity grayscale pointer-events-none z-0 h-[600px]" 
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }}
      />
      
      <SiteNav />
      
      <div className="flex-1 relative z-10 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
