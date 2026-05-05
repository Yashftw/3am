import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
        toast.success("Account created successfully!");
      } else {
        await login(email, password);
        toast.success("Logged in successfully!");
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-12 relative z-10 bg-transparent">
      <div className="w-full max-w-[1200px] h-auto md:h-[700px] min-h-[600px] bg-black/40 border border-white/10 backdrop-blur-md rounded-sm overflow-hidden flex shadow-elegant">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-16 flex flex-col justify-center relative">
          
          <div className="absolute top-8 left-8 flex items-center gap-2 group cursor-pointer">
            <div className="h-2 w-2 bg-white animate-pulse shadow-[0_0_10px_#ffffff]" />
            <span className="display-font text-lg tracking-widest text-foreground group-hover:text-white transition-colors">
              3am
            </span>
          </div>

          <div className="max-w-[360px] w-full mx-auto space-y-8">
            
            <div className="flex justify-center mb-12">
              <div className="w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center relative group">
                <div className="w-full h-0.5 bg-foreground absolute rotate-45 transform group-hover:bg-white transition-colors" />
                <div className="w-full h-full border-[3px] border-transparent border-t-foreground border-r-foreground rounded-full absolute group-hover:border-t-white group-hover:border-r-white transition-colors" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display text-white mb-2">{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
              <p className="text-sm text-muted-foreground">{isSignUp ? 'Start tracking your missions today.' : 'Enter your credentials to continue.'}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/90">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="hello@0.email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-white focus:ring-1 focus:ring-white/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm outline-none"
                    required
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
                    className="w-full bg-[#121212] border border-[#222] text-foreground focus:border-white focus:ring-1 focus:ring-white/30 transition-all rounded-sm py-3 pl-10 pr-4 text-sm outline-none"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200 transition-colors py-3 rounded-sm font-semibold mt-2 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSignUp ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground text-xs">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-white hover:text-white/70 transition-colors underline underline-offset-2"
                >
                  {isSignUp ? "Login" : "Sign up"}
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="hidden md:block w-1/2 relative bg-black border-l border-white/10 overflow-hidden">
           <img 
            src="/pillars.png" 
            alt="Classical Pillars" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80" />
        </div>

      </div>
    </div>
  );
}
