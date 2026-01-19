import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Crosshair, Timer, Radio, ArrowLeft, Users, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHandler } from "@/hooks/useHandlerMode";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Section color mapping - ensures visual consistency throughout the app
export const SECTION_COLORS = {
  home: {
    text: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary",
    activeBg: "bg-primary",
  },
  command: {
    text: "text-section-command",
    bg: "bg-section-command/10",
    border: "border-section-command",
    activeBg: "bg-section-command",
  },
  campaigns: {
    text: "text-section-campaigns",
    bg: "bg-section-campaigns/10",
    border: "border-section-campaigns",
    activeBg: "bg-section-campaigns",
  },
  missions: {
    text: "text-section-missions",
    bg: "bg-section-missions/10",
    border: "border-section-missions",
    activeBg: "bg-section-missions",
  },
  intel: {
    text: "text-section-intel",
    bg: "bg-section-intel/10",
    border: "border-section-intel",
    activeBg: "bg-section-intel",
  },
  hiit: {
    text: "text-section-hiit",
    bg: "bg-section-hiit/10",
    border: "border-section-hiit",
    activeBg: "bg-section-hiit",
  },
  rivals: {
    text: "text-section-rivals",
    bg: "bg-section-rivals/10",
    border: "border-section-rivals",
    activeBg: "bg-section-rivals",
  },
  handler: {
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning",
    activeBg: "bg-warning",
  },
} as const;

export type SectionType = keyof typeof SECTION_COLORS;

// Helper to get section from current path
export function getSectionFromPath(pathname: string): SectionType {
  if (pathname.startsWith("/command")) return "command";
  if (pathname.startsWith("/campaign")) return "campaigns";
  if (pathname.startsWith("/mission")) return "missions";
  if (pathname.startsWith("/intel")) return "intel";
  if (pathname.startsWith("/hiit")) return "hiit";
  if (pathname.startsWith("/rival")) return "rivals";
  if (pathname.startsWith("/handler")) return "handler";
  return "home";
}

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
  /** Override section color (auto-detected from route if not provided) */
  section?: SectionType;
  /** Optional action buttons to display next to nav icons */
  actions?: React.ReactNode;
  /** Hide the IRON PROTOCOL branding text (useful when page has its own hero branding) */
  hideBranding?: boolean;
}

export function GlobalNav({ 
  title, 
  subtitle, 
  showBack = true, 
  backTo = "/",
  className,
  section: sectionOverride,
  actions,
  hideBranding = false,
}: GlobalNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isHandler } = useIsHandler();
  const { user, signOut, isLoading, isAnonymous } = useAuth();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Auto-detect section from current path or use override
  const currentSection = sectionOverride || getSectionFromPath(location.pathname);
  const sectionColors = SECTION_COLORS[currentSection];

  const navItems = [
    { path: "/", icon: Home, label: "HOME", section: "home" as SectionType },
    { path: "/command", icon: Crosshair, label: "CMD", section: "command" as SectionType },
    { path: "/hiit", icon: Timer, label: "HIIT", section: "hiit" as SectionType },
    { path: "/intel", icon: Radio, label: "INTEL", section: "intel" as SectionType },
    // Handler icon only shows if user has handler role
    ...(isHandler ? [{ path: "/handler", icon: Users, label: "HANDLER", section: "handler" as SectionType }] : []),
  ];

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutDialog(false);
    navigate("/");
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("mb-6", className)}
      >
      {/* Guest Mode Banner - shown on all pages when not logged in */}
      {isAnonymous && (
        <div className="mb-4 px-3 py-2 bg-warning/10 border border-warning/30 rounded flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-warning text-xs">⚠️</span>
            <span className="text-xs text-warning/90 font-display truncate">GUEST MODE</span>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="flex-shrink-0 px-3 py-1 bg-primary text-primary-foreground font-display text-xs rounded hover:box-glow-primary transition-all"
          >
            SIGN IN
          </button>
        </div>
      )}

      {/* Primary nav row */}
      <div className="flex items-center justify-between mb-3">
        {/* Left side: Back button + Branding */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Back button */}
          {showBack ? (
            <button
              onClick={() => navigate(backTo)}
              className={cn(
                "p-2 border rounded transition-colors flex-shrink-0",
                sectionColors.border,
                "hover:bg-muted"
              )}
              aria-label="Go back"
            >
              <ArrowLeft className={cn("w-5 h-5", sectionColors.text)} />
            </button>
          ) : (
            <div className="w-9 flex-shrink-0" /> // Spacer for alignment
          )}

          {/* IRON PROTOCOL branding - hidden when page has hero branding */}
          {!hideBranding && (
            <span className="font-display text-sm text-muted-foreground tracking-wider truncate">
              IRON PROTOCOL
            </span>
          )}
        </div>

        {/* Right side: Nav icons + Auth controls */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const itemColors = SECTION_COLORS[item.section];
              const isActive = location.pathname === item.path || 
                (item.path === "/command" && location.pathname.startsWith("/command")) ||
                (item.path === "/command" && location.pathname.startsWith("/campaign")) ||
                (item.path === "/command" && location.pathname.startsWith("/mission")) ||
                (item.path === "/intel" && location.pathname.startsWith("/intel")) ||
                (item.path === "/intel" && location.pathname.startsWith("/rival")) ||
                (item.path === "/handler" && location.pathname.startsWith("/handler")) ||
                (item.path === "/hiit" && location.pathname.startsWith("/hiit"));
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "p-2.5 sm:p-2 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95",
                    isActive 
                      ? `${itemColors.text} ${itemColors.bg}` 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              );
            })}
          </nav>
          
          {/* Action buttons slot - renders inline with nav */}
          {actions && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-border">
              {actions}
            </div>
          )}

          {/* Auth controls - only shown when logged in */}
          {!isLoading && user && (
            <div className="flex items-center gap-0.5 sm:gap-1 ml-1 pl-1 border-l border-border">
              <button
                onClick={() => navigate("/profile")}
                className={cn(
                  "p-2.5 sm:p-2 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95",
                  location.pathname === "/profile"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label="Profile"
                title="Profile"
              >
                <User className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setShowSignOutDialog(true)}
                className="p-2.5 sm:p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title section */}
      {(title || subtitle) && (
        <div>
          {title && (
            <h1 className={cn("font-display text-2xl", sectionColors.text)}>{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground tracking-wider">{subtitle}</p>
          )}
        </div>
      )}
    </motion.header>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              SIGN OUT
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of Iron Protocol?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}