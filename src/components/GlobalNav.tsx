import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Crosshair, Timer, Radio, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHandler } from "@/hooks/useHandlerMode";

interface GlobalNavProps {
  /** Optional title to display in center */
  title?: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Show back button - defaults to true */
  showBack?: boolean;
  /** Custom back navigation - defaults to home */
  backTo?: string;
  /** Optional className for container */
  className?: string;
}

export function GlobalNav({ 
  title, 
  subtitle, 
  showBack = true, 
  backTo = "/",
  className 
}: GlobalNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isHandler } = useIsHandler();

  const navItems = [
    { path: "/", icon: Home, label: "HOME", color: "text-primary" },
    { path: "/command", icon: Crosshair, label: "CMD", color: "text-secondary" },
    { path: "/hiit", icon: Timer, label: "HIIT", color: "text-accent" },
    { path: "/intel", icon: Radio, label: "INTEL", color: "text-primary" },
    // Handler icon only shows if user has handler role
    ...(isHandler ? [{ path: "/handler", icon: Users, label: "HANDLER", color: "text-warning" }] : []),
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mb-6", className)}
    >
      {/* Primary nav row */}
      <div className="flex items-center justify-between mb-3">
        {/* Back button */}
        {showBack ? (
          <button
            onClick={() => navigate(backTo)}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" /> // Spacer for alignment
        )}

        {/* Quick nav icons */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === "/command" && location.pathname.startsWith("/command")) ||
              (item.path === "/handler" && location.pathname.startsWith("/handler"));
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "p-2 rounded transition-colors",
                  isActive 
                    ? `${item.color} bg-muted` 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Title section */}
      {(title || subtitle) && (
        <div>
          {title && (
            <h1 className="font-display text-2xl text-primary">{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground tracking-wider">{subtitle}</p>
          )}
        </div>
      )}
    </motion.header>
  );
}
