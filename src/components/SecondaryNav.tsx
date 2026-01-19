import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SecondaryNavTab {
  id: string;
  label: string;
  shortLabel?: string; // For mobile
  icon: LucideIcon;
  activeColor?: string; // e.g., "section-intel", "destructive", "primary"
  activeTextColor?: string; // e.g., "white", "black"
  badge?: number;
}

interface SecondaryNavProps {
  tabs: SecondaryNavTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  section?: "intel" | "profile" | "command";
  children?: React.ReactNode;
}

// Map of color names to their CSS variable classes
const colorMap: Record<string, { bg: string; text: string }> = {
  "section-intel": { bg: "bg-section-intel", text: "text-white" },
  "section-rivals": { bg: "bg-section-rivals", text: "text-black" },
  "section-command": { bg: "bg-section-command", text: "text-white" },
  "section-missions": { bg: "bg-section-missions", text: "text-white" },
  "section-campaigns": { bg: "bg-section-campaigns", text: "text-white" },
  "section-orders": { bg: "bg-section-orders", text: "text-white" },
  "destructive": { bg: "bg-destructive", text: "text-white" },
  "primary": { bg: "bg-primary", text: "text-primary-foreground" },
  "secondary": { bg: "bg-secondary", text: "text-secondary-foreground" },
  "warning": { bg: "bg-warning", text: "text-warning-foreground" },
};

export function SecondaryNav({
  tabs,
  activeTab,
  onTabChange,
  section = "intel",
  children,
}: SecondaryNavProps) {
  // Default section colors
  const sectionDefaults: Record<string, string> = {
    intel: "section-intel",
    profile: "primary",
    command: "section-command",
  };

  const defaultColorKey = sectionDefaults[section] || "section-intel";

  // Border color based on section
  const borderColor = {
    intel: "border-section-intel/30",
    profile: "border-border",
    command: "border-section-command/30",
  }[section];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList
        className={cn(
          "flex w-full mb-6 bg-card border overflow-x-auto scrollbar-hide snap-x snap-mandatory h-auto p-0",
          borderColor
        )}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const colorKey = tab.activeColor || defaultColorKey;
          const colors = colorMap[colorKey] || colorMap["primary"];
          const isActive = activeTab === tab.id;
          
          // Handle custom text color override
          const textColor = tab.activeTextColor === "text-black" ? "text-black" : 
                           tab.activeTextColor === "text-white" ? "text-white" : 
                           colors.text;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative font-display text-xs transition-all snap-start min-h-[40px] rounded-none",
                "data-[state=active]:shadow-none",
                isActive && colors.bg,
                isActive && textColor
              )}
            >
              <Icon className="w-3.5 h-3.5 mr-1 hidden sm:inline flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>

              {/* Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-section-orders text-white text-[10px] font-display rounded-full flex items-center justify-center">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {children}
    </Tabs>
  );
}

// Re-export TabsContent for convenience
export { TabsContent };
