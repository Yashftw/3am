import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EASE_OUT, spring, tap } from "@/lib/motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("[3am] 404 — no route for", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-transparent px-6">
      <div className="w-full max-w-md text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="eyebrow mb-6"
        >
          Off the map
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="display-font text-8xl leading-none text-gradient md:text-9xl"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
          className="hairline mx-auto my-8 w-40 origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
          className="mb-10 text-sm leading-relaxed text-muted-foreground"
        >
          There's nothing at{" "}
          <span className="mono-font text-white/70">{location.pathname}</span>.
          <br />
          Everything you've logged is still exactly where you left it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.5 }}
        >
          <Link to="/">
            <motion.span
              whileHover={{ x: -3 }}
              whileTap={tap}
              transition={spring.snappy}
              className="ghost-button inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the dashboard
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
