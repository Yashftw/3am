import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useUser } from "@/lib/user-context";
import { LogOut } from "lucide-react";
import { SyncBadge } from "@/components/motion/SyncBadge";
import { spring, tap } from "@/lib/motion";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/settings", label: "Settings" },
];

export const SiteNav = () => {
  const [time, setTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);
  const { logout } = useUser();
  const location = useLocation();
  const { scrollY } = useScroll();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Condense the bar once the page moves, so the header earns its space.
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);
  });

  const activePath = links.some((l) => l.to === location.pathname) ? location.pathname : null;

  return (
    <motion.header
      initial={false}
      animate={{
        paddingTop: scrolled ? 10 : 16,
        paddingBottom: scrolled ? 10 : 16,
        backgroundColor: scrolled ? "rgba(10,10,10,0.82)" : "rgba(10,10,10,0.55)",
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-y-3 border-b border-white/5 px-4 backdrop-blur-xl md:px-12"
    >
      <NavLink to="/" className="group flex items-center gap-2.5">
        <motion.span
          className="h-1.5 w-1.5 bg-white"
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 10px rgba(255,255,255,0.7)" }}
        />
        <span className="font-display text-lg tracking-[0.2em] text-foreground transition-colors group-hover:text-white">
          3am
        </span>
      </NavLink>

      <nav className="no-scrollbar order-3 flex w-full items-center gap-1 overflow-x-auto text-sm font-medium md:order-none md:w-auto md:gap-2">
        {links.map((l) => {
          const isActive = activePath === l.to;
          return (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className="relative shrink-0 px-3 py-1.5">
              {/* Shared-element pill: slides between items instead of fading */}
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 border border-white/10 bg-white/[0.07]"
                  transition={spring.layout}
                />
              )}
              <motion.span
                whileTap={tap}
                className={`relative z-[1] block transition-colors duration-300 ${
                  isActive ? "text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {l.label}
              </motion.span>
            </NavLink>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        <SyncBadge />

        <span className="mono-font hidden text-xs tabular-nums text-muted-foreground sm:inline">
          {time.toLocaleTimeString("en-US", { hour12: false })}
        </span>

        <motion.button
          whileTap={tap}
          whileHover={{ x: 1 }}
          onClick={logout}
          className="p-2 text-muted-foreground transition-colors hover:text-white"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.header>
  );
};
