import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AppFooter() {
  const navigate = useNavigate();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-12 pb-6 text-center space-y-3"
    >
      <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
        <button
          onClick={() => navigate("/guide")}
          className="text-muted-foreground hover:text-secondary transition-colors"
        >
          ? Guide
        </button>
        <span className="text-muted-foreground/30">|</span>
        <button
          onClick={() => navigate("/donate")}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          ♥ Support
        </button>
        <span className="text-muted-foreground/30">|</span>
        <button
          onClick={() => navigate("/feedback")}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          ✉ Feedback
        </button>
        <span className="text-muted-foreground/30">|</span>
        <button
          onClick={() => navigate("/legal")}
          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <span>§</span> Legal
        </button>
      </div>
      <p className="text-xs text-muted-foreground/50 tracking-widest">v1.0 // NO MERCY</p>
    </motion.footer>
  );
}
