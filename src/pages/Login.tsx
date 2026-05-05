import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useUser } from "@/lib/user-context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Use the part before @ as the username, or default to Guest
    const name = email.split("@")[0] || "Guest";
    login(name);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative z-10 bg-[#0a0a0a]">
      <div className="w-full max-w-[1200px] h-[700px] bg-black/40 border border-white/10 backdrop-blur-md rounded-sm overflow-hidden flex shadow-elegant">
        
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative">
          
          <div className="absolute top-8 left-8 flex items-center gap-2 group cursor-pointer">
            <div className="h-2 w-2 bg-white animate-pulse shadow-[0_0_10px_#ffffff]" />
            <span className="display-font text-lg tracking-widest text-foreground group-hover:text-white transition-colors">
              NORTH
            </span>
          </div>

          <div className="max-w-[360px] w-full mx-auto space-y-8">
            
            {/* Minimalist Logo */}
            <div className="flex justify-center mb-12">
              <div className="w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center relative group">
                <div className="w-full h-0.5 bg-foreground absolute rotate-45 transform group-hover:bg-white transition-colors" />
                <div className="w-full h-full border-[3px] border-transparent border-t-foreground border-r-foreground rounded-full absolute group-hover:border-t-white group-hover:border-r-white transition-colors" />
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="hello@0.email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-white focus:ring-1 focus:ring-white/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="password" 
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-white focus:ring-1 focus:ring-white/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-sm font-semibold mt-2">
                Login
              </button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground text-xs">
                Don't have an account? <Link to="#" className="text-white hover:text-white/70 transition-colors underline underline-offset-2">Sign up</Link>
              </span>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#222]"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">or</span>
              <div className="flex-grow border-t border-[#222]"></div>
            </div>

            <button 
              onClick={() => handleLogin()} 
              className="w-full bg-black border border-[#222] text-white hover:border-white/50 transition-colors py-3 rounded-sm font-semibold flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with Google
            </button>

          </div>
        </div>

        {/* Right Side: Bitwise Pillars Image */}
        <div className="hidden md:block w-1/2 relative bg-black border-l border-white/10 overflow-hidden">
           <img 
            src="/pillars.png" 
            alt="Classical Pillars ASCII Art" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80" />
        </div>

      </div>
    </div>
  );
}
