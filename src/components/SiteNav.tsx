import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";
import { LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/settings", label: "Settings" },
];

export const SiteNav = () => {
  const [time, setTime] = useState(new Date());
  const { logout } = useUser();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="relative z-20 px-6 md:px-12 py-4 flex items-center justify-between border-b border-white/10 bg-background/90 backdrop-blur-md sticky top-0">
      <NavLink to="/" className="flex items-center gap-3 group">
        <div className="h-2 w-2 bg-white animate-pulse shadow-[0_0_10px_#ffffff]" />
        <span className="display-font text-xl tracking-[0.2em] text-foreground group-hover:text-white transition-colors">
          NORTH<span className="text-white opacity-50">_OS</span>
        </span>
      </NavLink>
      <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] font-bold">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `transition-all duration-300 relative px-2 py-1 ${
                isActive 
                  ? "text-white border-b border-white text-shadow-glow" 
                  : "text-muted-foreground hover:text-white hover:border-b hover:border-white/50"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <div className="mono-font text-sm text-white flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2">
          <span className="hidden sm:inline opacity-70">
            {time.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()}
          </span>
          <span className="opacity-40">|</span>
          <span className="font-bold tracking-widest text-shadow-glow">
            {time.toLocaleTimeString("en-US", { hour12: false })}
          </span>
        </div>
        <button onClick={logout} className="text-muted-foreground hover:text-white transition-colors p-2" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
