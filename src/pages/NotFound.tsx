import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <h1 className="font-display text-8xl md:text-[12rem] text-destructive text-glow-primary mb-4">
            404
          </h1>
          <p className="font-display text-2xl text-muted-foreground mb-2">
            TARGET NOT FOUND
          </p>
          <p className="text-sm text-muted-foreground/50 mb-8">
            Mission location does not exist
          </p>
          
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-lg rounded hover:box-glow-primary transition-all"
          >
            <Home className="w-5 h-5" />
            RETURN TO BASE
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
