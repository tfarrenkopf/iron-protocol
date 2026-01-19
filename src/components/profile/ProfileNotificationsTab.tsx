import { motion } from "framer-motion";
import { Bell, Clock, CheckCircle } from "lucide-react";

// Placeholder component - notification delivery logic will be implemented in a separate PRD
export function ProfileNotificationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Placeholder Inbox */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg text-muted-foreground mb-2">NOTIFICATIONS</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Coming soon — system events and alerts will appear here
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Feature in development
        </div>
      </div>

      {/* Preview of what's coming */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-display text-muted-foreground mb-3">PLANNED FEATURES</div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-muted-foreground/50" />
            <span>New mission assignments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-muted-foreground/50" />
            <span>Boss defeat celebrations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-muted-foreground/50" />
            <span>Achievement unlocks</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-muted-foreground/50" />
            <span>Rival activity</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-muted-foreground/50" />
            <span>Campaign completions</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
