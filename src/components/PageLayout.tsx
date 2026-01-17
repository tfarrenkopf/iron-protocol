import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * Canonical page layout wrapper for consistent widths across the app.
 * 
 * Width variants:
 * - "narrow" (max-w-2xl / 672px): Detail pages (Mission, Campaign, Exercise)
 * - "standard" (max-w-3xl / 768px): Hub/list pages (Command, Intel, Profile)
 * - "wide" (max-w-4xl / 896px): Dashboard only (hero sections)
 */
interface PageLayoutProps {
  children: ReactNode;
  /** Width variant - defaults to "standard" */
  width?: "narrow" | "standard" | "wide";
  /** Additional className */
  className?: string;
  /** Show scanlines overlay - defaults to true */
  scanlines?: boolean;
}

const WIDTH_CLASSES = {
  narrow: "max-w-sm",      // Modals/invite pages (JoinSquad, RivalInvite)
  standard: "max-w-3xl",   // All primary pages (Dashboard, Command, Intel, Profile, etc.)
  wide: "max-w-4xl",       // Reserved for special full-width layouts
} as const;

export function PageLayout({ 
  children, 
  width = "standard", 
  className,
  scanlines = true 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      {scanlines && (
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      )}

      {/* Content container */}
      <div className={cn(
        "relative z-10 container mx-auto px-4 py-6",
        WIDTH_CLASSES[width],
        className
      )}>
        {children}
      </div>
    </div>
  );
}
