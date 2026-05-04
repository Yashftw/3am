import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Github } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 relative z-10">
      <div className="w-full max-w-[1200px] h-[700px] bg-black/40 border border-primary/20 backdrop-blur-md rounded-sm overflow-hidden flex shadow-elegant">
        
        {/* Left Side: Login Form */}
        <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative">
          
          <div className="absolute top-8 left-8 flex items-center gap-2 group cursor-pointer">
            <div className="h-2 w-2 bg-primary animate-pulse shadow-[0_0_10px_#00E5FF]" />
            <span className="display-font text-lg tracking-widest text-foreground group-hover:text-primary transition-colors">
              NORTH
            </span>
          </div>

          <div className="max-w-[360px] w-full mx-auto space-y-8">
            
            {/* Minimalist Logo */}
            <div className="flex justify-center mb-12">
              <div className="w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center relative group">
                <div className="w-full h-0.5 bg-foreground absolute rotate-45 transform group-hover:bg-primary transition-colors" />
                <div className="w-full h-full border-[3px] border-transparent border-t-foreground border-r-foreground rounded-full absolute group-hover:border-t-primary group-hover:border-r-primary transition-colors" />
              </div>
            </div>

            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="hello@0.email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm"
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
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>

              <button className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-sm font-semibold mt-2">
                Login
              </button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground text-xs">
                Don't have an account? <Link to="#" className="text-white hover:text-primary transition-colors underline underline-offset-2">Sign up</Link>
              </span>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#222]"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs">or</span>
              <div className="flex-grow border-t border-[#222]"></div>
            </div>

            <button className="w-full bg-black border border-[#222] text-white hover:border-primary/50 transition-colors py-3 rounded-sm font-semibold flex items-center justify-center gap-3">
              <Github className="w-5 h-5" />
              Login with Github
            </button>

          </div>
        </div>

        {/* Right Side: Bitwise Pillars Image */}
        <div className="hidden md:block w-1/2 relative bg-black border-l border-primary/20 overflow-hidden">
           <img 
            src="/pillars.png" 
            alt="Classical Pillars ASCII Art" 
            className="w-full h-full object-cover opacity-80"
          />
          {/* Cyan mesh overlay to blend with the HUD theme */}
          <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80" />
        </div>

      </div>
    </div>
  );
}
