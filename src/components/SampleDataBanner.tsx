import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

interface SampleDataBannerProps {
  /** Custom message - defaults to standard sample data text */
  message?: string;
  /** Show sign in CTA - defaults to true */
  showCTA?: boolean;
  /** Compact mode for smaller widgets */
  compact?: boolean;
}

/**
 * Standardized sample data preview indicator for guest users.
 * Use this component consistently across all widgets showing preview data.
 */
export function SampleDataBanner({ 
  message = "Sign in to track your real progress",
  showCTA = true,
  compact = false,
}: SampleDataBannerProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-b border-muted rounded-t">
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-display">PREVIEW</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/50 border-b border-muted">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground">
          <span className="font-display">SAMPLE DATA</span>
          {message && <span className="hidden sm:inline"> · {message}</span>}
        </span>
      </div>
      {showCTA && (
        <button
          onClick={() => navigate("/auth")}
          className="flex-shrink-0 px-3 py-1 bg-primary text-primary-foreground font-display text-xs rounded hover:bg-primary/90 transition-colors active:scale-95"
        >
          SIGN IN
        </button>
      )}
    </div>
  );
}
