import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { EASE_OUT, spring, tap } from "@/lib/motion";

/** Firebase auth codes are not sentences; these are. */
function describeAuthError(err: unknown): string {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists for that email.";
    case "auth/weak-password":
      return "Choose a password of at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "No connection. Check your network and try again.";
    default:
      return err instanceof Error ? err.message : "Something went wrong. Try again.";
  }
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
        toast.success("Account created", { description: "Welcome to 3am." });
      } else {
        await login(email, password);
        toast.success("Welcome back");
      }
      navigate("/");
    } catch (err) {
      toast.error(isSignUp ? "Couldn't create that account" : "Couldn't sign you in", {
        description: describeAuthError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-transparent p-4 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: EASE_OUT }}
        className="surface-card flex h-auto min-h-[600px] w-full max-w-[1200px] overflow-hidden rounded-sm shadow-elegant md:h-[700px]"
      >
        {/* Form */}
        <div className="relative flex w-full flex-col justify-center p-6 md:w-1/2 md:p-10 lg:p-16">
          <div className="absolute left-8 top-8 flex items-center gap-2">
            <motion.span
              className="h-2 w-2 bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ boxShadow: "0 0 10px #fff" }}
            />
            <span className="display-font text-lg tracking-[0.2em] text-foreground">3am</span>
          </div>

          <div className="mx-auto w-full max-w-[360px] space-y-8">
            {/* Mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ ...spring.gentle, delay: 0.2 }}
              // Clears the absolutely-positioned wordmark on narrow screens.
              className="mb-12 mt-10 flex justify-center md:mt-0"
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={spring.gentle}
                className="group relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground"
              >
                <div className="absolute h-0.5 w-full rotate-45 transform bg-foreground transition-colors group-hover:bg-white" />
                <div className="absolute h-full w-full rounded-full border-[3px] border-transparent border-r-foreground border-t-foreground transition-colors group-hover:border-r-white group-hover:border-t-white" />
              </motion.div>
            </motion.div>

            {/* Heading swaps with the mode */}
            <div className="min-h-[68px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isSignUp ? "signup" : "login"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                >
                  <h2 className="mb-2 font-display text-2xl text-gradient">
                    {isSignUp ? "Create an account" : "Welcome back"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? "Start tracking your missions today." : "Enter your credentials to continue."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground/90">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="hello@0.email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hud-input w-full py-3 pl-10 pr-4 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hud-input w-full py-3 pl-10 pr-11 text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-[11px] text-muted-foreground/70">At least 6 characters.</p>
                )}
              </div>

              <motion.button
                whileTap={tap}
                type="submit"
                disabled={loading}
                className="hud-button mt-2 flex w-full items-center justify-center gap-2 py-3"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignUp ? "Sign up" : "Login"}
              </motion.button>
            </form>

            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp((v) => !v)}
                  className="text-white underline underline-offset-4 transition-colors hover:text-white/70"
                >
                  {isSignUp ? "Login" : "Sign up"}
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Artwork */}
        <div className="relative hidden w-1/2 overflow-hidden border-l border-white/10 bg-black md:block">
          <motion.img
            src="/pillars.png"
            alt=""
            aria-hidden
            initial={{ scale: 1.14, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ duration: 1.6, ease: EASE_OUT }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
            className="absolute bottom-10 left-10 right-10"
          >
            <p className="eyebrow mb-2">Track quietly</p>
            <p className="font-display text-xl leading-snug text-white/90">
              Sleep, training, tasks and spending —
              <br />
              in one place, every night.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
