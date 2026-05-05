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
    <header className="relative z-20 px-4 md:px-12 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 flex-wrap gap-y-4">
      <NavLink to="/" className="flex items-center gap-3 group">

        <span className="font-display text-lg tracking-widest text-foreground group-hover:text-white transition-colors">
          3am
        </span>
      </NavLink>
      <nav className="flex items-center gap-4 md:gap-8 text-sm font-medium order-3 w-full md:w-auto md:order-none overflow-x-auto no-scrollbar pb-1 md:pb-0">
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
