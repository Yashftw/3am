import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/login", label: "Login" },
  { to: "/settings", label: "Settings" },
];

interface Props {
  variant?: "hero" | "solid";
}

export const SiteNav = ({ variant = "solid" }: Props) => {
  const onHero = variant === "hero";
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className={`relative z-20 px-6 md:px-12 py-4 flex items-center justify-between ${
        onHero ? "border-b border-primary/20" : "border-b border-primary/30 bg-background/90 backdrop-blur-md sticky top-0"
      }`}
    >
      <NavLink to="/" className="flex items-center gap-3 group">
        <div className="h-2 w-2 bg-primary animate-pulse shadow-[0_0_10px_#00E5FF]" />
        <span className="display-font text-xl tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">
          NORTH<span className="text-primary">_OS</span>
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
                  ? "text-primary border-b border-primary text-shadow-glow" 
                  : "text-muted-foreground hover:text-primary hover:border-b hover:border-primary/50"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="mono-font text-sm text-primary flex items-center gap-4 bg-primary/5 border border-primary/20 px-4 py-2">
        <span className="hidden sm:inline opacity-70">
          {time.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()}
        </span>
        <span className="opacity-40">|</span>
        <span className="font-bold tracking-widest text-shadow-glow">
          {time.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </header>
  );
};
