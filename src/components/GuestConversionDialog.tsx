import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserPlus, Shield, LogIn, X } from "lucide-react";

interface GuestConversionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // What action triggered this (e.g., "create exercises", "save missions")
}

export const GuestConversionDialog = ({ isOpen, onClose, action }: GuestConversionDialogProps) => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    onClose();
    navigate("/auth?mode=signup");
  };

  const handleSignIn = () => {
    onClose();
    navigate("/auth?mode=signin");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog - Mobile-first bottom sheet style */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary rounded-t-2xl p-6 max-w-lg mx-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>

              {/* Headline */}
              <div>
                <h2 className="font-display text-xl text-foreground mb-2">
                  UNLOCK THIS FEATURE
                </h2>
                <p className="text-muted-foreground text-sm">
                  Create an account to {action} and save your progress permanently.
                </p>
              </div>

              {/* Privacy statement */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>No tracking. No ads. Your data stays yours.</span>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCreateAccount}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-display text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  CREATE ACCOUNT
                </button>

                <button
                  onClick={handleSignIn}
                  className="w-full py-3.5 bg-card border-2 border-border text-foreground font-display text-sm rounded-lg hover:border-primary/50 transition-colors flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  SIGN IN
                </button>
              </div>

              {/* Dismiss option */}
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Continue browsing as guest
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
