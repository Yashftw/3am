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
    <header className="relative z-20 px-6 md:px-12 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0">
      <NavLink to="/" className="flex items-center gap-3 group">
        <div className="w-6 h-6 border-[1.5px] border-foreground rounded-full flex items-center justify-center relative transition-colors group-hover:border-white">
          <div className="w-full h-[1.5px] bg-foreground absolute rotate-45 transform transition-colors group-hover:bg-white" />
        </div>
        <span className="font-display text-lg tracking-widest text-foreground group-hover:text-white transition-colors">
          NORTH
        </span>
      </NavLink>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `transition-all duration-300 relative py-1 ${
                isActive 
                  ? "text-white" 
                  : "text-muted-foreground hover:text-white"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span className="hidden sm:inline">
            {time.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: '2-digit' })}
          </span>
          <span className="opacity-40">|</span>
          <span className="font-mono">
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
