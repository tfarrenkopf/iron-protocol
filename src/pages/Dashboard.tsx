import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Timer, ChevronRight, Users, Crosshair, Radio } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/useAuth";
import { useIsHandler } from "@/hooks/useHandlerMode";
import { IncomingOrders } from "@/components/IncomingOrders";
import { FirstVisitPopup } from "@/components/FirstVisitPopup";
import { WeeklySummary } from "@/components/WeeklySummary";
import { RivalWidget } from "@/components/RivalWidget";
import { FightNowActions } from "@/components/FightNowActions";
import { WeeklyBossWidget } from "@/components/WeeklyBossWidget";
import { GlobalNav } from "@/components/GlobalNav";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { data: isHandler } = useIsHandler();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* GlobalNav - consistent with other pages, hide branding since hero has it */}
        <GlobalNav showBack={false} section="home" hideBranding />

        {/* Hero Branding Section */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-8"
        >
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-primary text-glow-primary tracking-wider mb-2">
            IRON PROTOCOL
          </h1>
          <p className="font-body text-muted-foreground text-xs sm:text-sm tracking-widest uppercase">
            Crush workouts. Deal damage. Dominate the weekly raid.
          </p>
        </motion.header>

        {/* All Dashboard Widgets - Normalized spacing */}
        <div className="space-y-6">
          {/* Primary Actions */}
          <FightNowActions />

          {/* Utility Actions Row - HIIT, INTEL, HANDLER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`grid gap-3 grid-cols-2 ${isHandler ? "sm:grid-cols-3" : ""}`}
          >
            <button
              onClick={() => navigate("/hiit")}
              className="group relative bg-card border border-section-hiit/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-section-hiit hover:bg-section-hiit/5 active:scale-[0.98] min-h-[64px] sm:min-h-[72px]"
            >
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-section-hiit mx-auto mb-1 sm:mb-2" />
              <h2 className="font-display text-xs sm:text-sm text-section-hiit">HIIT</h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Interval Timer</p>
            </button>

            <button
              onClick={() => navigate("/intel")}
              className="group relative bg-card border border-section-intel/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-section-intel hover:bg-section-intel/5 active:scale-[0.98] min-h-[64px] sm:min-h-[72px]"
            >
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-section-intel mx-auto mb-1 sm:mb-2" />
              <h2 className="font-display text-xs sm:text-sm text-section-intel">INTEL</h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Global Activity</p>
            </button>

            {isHandler && (
              <button
                onClick={() => navigate("/handler")}
                className="group relative bg-card border border-warning/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-warning hover:bg-warning/5 active:scale-[0.98] min-h-[64px] sm:min-h-[72px] col-span-2 sm:col-span-1"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-warning mx-auto mb-1 sm:mb-2" />
                <h2 className="font-display text-xs sm:text-sm text-warning">HANDLER</h2>
                <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Squad Control</p>
              </button>
            )}
          </motion.div>

          {/* COMMAND CENTER - Full width for logged-in users */}
          {!isAnonymous && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/command")}
              className="w-full group bg-card border-2 border-section-command/50 rounded-lg p-4 flex items-center justify-between hover:border-section-command hover:box-glow-command transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-section-command/10 rounded-lg">
                  <Crosshair className="w-6 h-6 text-section-command" />
                </div>
                <div className="text-left">
                  <h2 className="font-display text-base sm:text-lg text-section-command">COMMAND CENTER</h2>
                  <p className="text-xs text-muted-foreground">Select or create exercises, missions, campaigns</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-section-command group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </motion.button>
          )}

          {/* Incoming Orders - Only for logged-in users, appears after Command Center */}
          {!isAnonymous && <IncomingOrders />}

          {/* Weekly Boss Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <WeeklyBossWidget />
          </motion.div>

          {/* Weekly Summary - Collapsible for logged-in users, expanded for guests */}
          <WeeklySummary collapsible={!isAnonymous} defaultCollapsed={!isAnonymous} />

          {/* Rival Mode Widget - Only for logged-in users */}
          {!isAnonymous && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <RivalWidget />
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <AppFooter />

        {/* First Visit Popup */}
        <FirstVisitPopup />
      </div>
    </div>
  );
};

export default Dashboard;
