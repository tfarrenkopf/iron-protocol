import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SecondaryNavTab {
  id: string;
  label: string;
  shortLabel?: string; // For mobile
  icon: LucideIcon;
  badge?: number;
}

interface SecondaryNavProps {
  tabs: SecondaryNavTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  section?: "intel" | "profile" | "command" | "missions" | "campaigns" | "exercises";
  disabled?: boolean;
  className?: string;
}

// Section color mapping - active state colors
const sectionColors: Record<string, { active: string; inactive: string }> = {
  intel: { 
    active: "bg-section-intel text-white", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
  profile: { 
    active: "bg-primary text-primary-foreground", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
  command: { 
    active: "bg-section-command text-white", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
  missions: { 
    active: "bg-section-missions text-white", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
  campaigns: { 
    active: "bg-section-campaigns text-white", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
  exercises: { 
    active: "bg-section-command text-white", 
    inactive: "text-muted-foreground hover:text-foreground" 
  },
};

export function SecondaryNav({
  tabs,
  activeTab,
  onTabChange,
  section = "intel",
  disabled = false,
  className,
}: SecondaryNavProps) {
  const colors = sectionColors[section] || sectionColors.intel;

  return (
    <div 
      className={cn(
        "inline-flex bg-muted/30 rounded-lg p-0.5 border border-border overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={disabled}
            className={cn(
              "relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-display transition-all flex-1 min-w-0 snap-start",
              isActive ? colors.active : colors.inactive,
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{tab.label}</span>
            <span className="sm:hidden truncate">{tab.shortLabel || tab.label}</span>

            {/* Badge */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-section-orders text-white text-[10px] font-display rounded-full flex items-center justify-center">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
