import { Outlet, Navigate, useLocation } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
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

/** Hairline reading-progress bar pinned under the header. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-40 h-px origin-left bg-gradient-to-r from-white/0 via-white/70 to-white/0"
    />
  );
};

export const Layout = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent text-foreground">
      <ScrollProgress />
      <SiteNav />

      <div className="relative z-10 flex flex-1 flex-col">
        <Outlet />
      </div>

      <footer className="relative z-20 mt-12 w-full border-t border-white/5 bg-[#0a0a0a]/80 py-7 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-1 px-4 md:px-12">
          <div className="hairline mb-4 w-24 opacity-40" />
          <p className="mono-font text-xs tracking-wide text-muted-foreground">
            made by : <span className="font-medium text-white">yashraj</span> and{" "}
            <span className="font-medium text-white">antigravity</span> respectively
          </p>
        </div>
      </footer>
    </div>
  );
};
