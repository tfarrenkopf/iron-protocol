import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Crosshair, Timer, Radio, ArrowLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsHandler } from "@/hooks/useHandlerMode";

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
}

export function GlobalNav({ 
  title, 
  subtitle, 
  showBack = true, 
  backTo = "/",
  className,
  section: sectionOverride,
}: GlobalNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: isHandler } = useIsHandler();

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
            className={cn(
              "p-2 border rounded transition-colors",
              sectionColors.border,
              "hover:bg-muted"
            )}
            aria-label="Go back"
          >
            <ArrowLeft className={cn("w-5 h-5", sectionColors.text)} />
          </button>
        ) : (
          <div className="w-9" /> // Spacer for alignment
        )}

        {/* Quick nav icons */}
        <nav className="flex items-center gap-1">
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
                  "p-2 rounded transition-colors",
                  isActive 
                    ? `${itemColors.text} ${itemColors.bg}` 
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
            <h1 className={cn("font-display text-2xl", sectionColors.text)}>{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground tracking-wider">{subtitle}</p>
          )}
        </div>
      )}
    </motion.header>
  );
}
