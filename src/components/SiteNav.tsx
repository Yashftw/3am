import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/settings", label: "Settings" },
];

interface Props {
  variant?: "hero" | "solid";
}

export const SiteNav = ({ variant = "solid" }: Props) => {
  const onHero = variant === "hero";
  return (
    <header
      className={`relative z-20 px-6 md:px-12 py-6 flex items-center justify-between ${
        onHero ? "border-b border-foreground/10" : "border-b border-border bg-background/80 backdrop-blur-md sticky top-0"
      }`}
    >
      <NavLink to="/" className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="display-font text-lg tracking-widest">NORTH</span>
      </NavLink>
      <nav className="hidden md:flex items-center gap-10 text-xs uppercase tracking-[0.2em]">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `transition-colors story-link ${isActive ? "text-primary" : "text-foreground/80 hover:text-primary"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="mono-font text-xs text-foreground/70 hidden md:block">
        {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
      </div>
    </header>
  );
};
