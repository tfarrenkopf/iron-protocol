import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Timer, Radio, User, LogOut, ChevronRight, Users, Crosshair } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";
import { useMissions } from "@/hooks/useMissions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useIsHandler } from "@/hooks/useHandlerMode";
import { IncomingOrders } from "@/components/IncomingOrders";
import { FirstVisitPopup } from "@/components/FirstVisitPopup";
import { WeeklySummary } from "@/components/WeeklySummary";
import { RivalWidget } from "@/components/RivalWidget";
import { FightNowActions } from "@/components/FightNowActions";
import { WeeklyBossWidget } from "@/components/WeeklyBossWidget";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: missions } = useMissions({ showOnlyPublic: true });

  const { data: isHandler } = useIsHandler();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutDialog(false);
    navigate("/");
  };

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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Guest Mode Banner */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-warning font-display">⚠️ GUEST MODE ACTIVE</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your progress won't be saved. Create an account to track your gains and appear on the leaderboard.
              </p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground font-display text-sm rounded hover:box-glow-primary transition-all"
            >
              SIGN IN
            </button>
          </motion.div>
        )}

        {/* Auth Status Bar */}
        {!isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-end mb-4"
          >
            <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-2.5 py-2 bg-card/50 backdrop-blur-sm border border-border rounded hover:border-primary transition-colors"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline text-xs font-display text-primary max-w-[10rem] truncate">
                  {profile?.display_name || "AGENT"}
                </span>
              </button>
              <button
                onClick={() => setShowSignOutDialog(true)}
                className="p-2 bg-card/50 backdrop-blur-sm border border-border rounded hover:border-destructive hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-6xl md:text-8xl text-primary text-glow-primary tracking-wider mb-2">
            IRON PROTOCOL
          </h1>
          <p className="font-body text-muted-foreground text-sm tracking-widest uppercase">
            Crush workouts. Deal damage. Dominate the weekly raid.
          </p>
        </motion.header>

        {/* All Dashboard Widgets - Normalized spacing */}
        <div className="space-y-6">
          {/* Primary Actions + Utility Grid */}
          <div className="space-y-4">
            <FightNowActions />

            {/* Utility Actions Row - HIIT, INTEL, HANDLER */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`grid gap-3 sm:gap-4 grid-cols-2 ${isHandler ? "sm:grid-cols-3" : ""}`}
            >
              <button
                onClick={() => navigate("/hiit")}
                className="group relative bg-card border border-section-hiit/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-section-hiit hover:bg-section-hiit/5 active:scale-[0.98] min-h-[72px]"
              >
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-section-hiit mx-auto mb-1.5 sm:mb-2" />
                <h2 className="font-display text-xs sm:text-sm text-section-hiit">HIIT</h2>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Interval Timer</p>
              </button>

              <button
                onClick={() => navigate("/intel")}
                className="group relative bg-card border border-section-intel/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-section-intel hover:bg-section-intel/5 active:scale-[0.98] min-h-[72px]"
              >
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-section-intel mx-auto mb-1.5 sm:mb-2" />
                <h2 className="font-display text-xs sm:text-sm text-section-intel">INTEL</h2>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Global Activity</p>
              </button>

              {isHandler && (
                <button
                  onClick={() => navigate("/handler")}
                  className="group relative bg-card border border-warning/50 rounded-lg p-3 sm:p-4 text-center transition-all hover:border-warning hover:bg-warning/5 active:scale-[0.98] min-h-[72px] col-span-2 sm:col-span-1"
                >
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-warning mx-auto mb-1.5 sm:mb-2" />
                  <h2 className="font-display text-xs sm:text-sm text-warning">HANDLER</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">Squad Control</p>
                </button>
              )}
            </motion.div>

            {/* COMMAND CENTER - Full width for logged-in users */}
            {!isAnonymous && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
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
          </div>

          {/* Weekly Boss Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <WeeklyBossWidget />
          </motion.div>

          {/* Weekly Summary - Collapsible for logged-in users, expanded for guests */}
          <WeeklySummary collapsible={!isAnonymous} defaultCollapsed={!isAnonymous} />

          {/* Incoming Orders - Only for logged-in users */}
          {!isAnonymous && <IncomingOrders />}

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

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              SIGN OUT
            </AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out of Iron Protocol?</AlertDialogDescription>
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
    </div>
  );
};

export default Dashboard;
