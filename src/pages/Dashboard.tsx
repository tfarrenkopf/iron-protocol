import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crosshair, Timer, Radio, User, LogOut, ChevronRight, Users, Play } from "lucide-react";
import { useMissions } from "@/hooks/useMissions";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useIsHandler } from "@/hooks/useHandlerMode";
import { IncomingOrders } from "@/components/IncomingOrders";
import { FirstVisitPopup } from "@/components/FirstVisitPopup";
import { WeeklySummary } from "@/components/WeeklySummary";
import { RivalWidget } from "@/components/RivalWidget";

// Helper to get a random item from an array
const getRandomItem = <T,>(arr: T[]): T | undefined => {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: missions } = useMissions({ showOnlyPublic: true });

  // Select 3 random missions (1 short, 1 medium, 1 long)
  const featuredMissions = useMemo(() => {
    if (!missions || missions.length === 0) return [];

    const shortMissions = missions.filter((m) => m.estimated_minutes < 20);
    const mediumMissions = missions.filter((m) => m.estimated_minutes >= 20 && m.estimated_minutes < 40);
    const longMissions = missions.filter((m) => m.estimated_minutes >= 40);

    const selected: typeof missions = [];

    const short = getRandomItem(shortMissions);
    const medium = getRandomItem(mediumMissions);
    const long = getRandomItem(longMissions);

    if (short) selected.push(short);
    if (medium) selected.push(medium);
    if (long) selected.push(long);

    const selectedIds = new Set(selected.map((m) => m.id));
    const remaining = missions.filter((m) => !selectedIds.has(m.id));

    while (selected.length < 3 && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(randomIndex, 1)[0]);
    }

    return selected.sort((a, b) => a.estimated_minutes - b.estimated_minutes);
  }, [missions]);
  
  const { data: isHandler } = useIsHandler();

  const handleSignOut = async () => {
    await signOut();
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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
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
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded hover:border-primary transition-colors"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-display text-primary">{profile?.display_name || "AGENT"}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 border border-border rounded hover:border-destructive hover:text-destructive transition-colors"
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
            Complete Missions • Defeat Enemies • Get Stronger
          </p>
        </motion.header>

        {/* Primary Action - FIGHT NOW */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate("/command")}
            className="w-full group relative bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary rounded-lg p-6 text-center transition-all hover:box-glow-primary hover:from-primary/30 hover:via-primary/20 hover:to-primary/30"
          >
            <div className="flex items-center justify-center gap-4">
              <Play className="w-10 h-10 text-primary" />
              <div>
                <h2 className="font-display text-3xl text-primary text-glow-primary">FIGHT NOW</h2>
                <p className="text-sm text-muted-foreground mt-1">Select a mission and begin combat</p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Secondary Actions Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`grid gap-3 mb-8 ${isHandler ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
        >
          <button
            onClick={() => navigate("/command")}
            className="group relative bg-card border-2 border-secondary rounded p-4 text-left transition-all hover:box-glow-secondary hover:border-secondary"
          >
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors rounded" />
            <Crosshair className="w-6 h-6 text-secondary mb-2 relative z-10" />
            <h2 className="font-display text-base text-secondary relative z-10">COMMAND</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 relative z-10">Arsenal</p>
          </button>

          <button
            onClick={() => navigate("/hiit")}
            className="group relative bg-card border-2 border-accent rounded p-4 text-left transition-all"
            style={{ boxShadow: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 20px hsl(20 100% 60% / 0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors rounded" />
            <Timer className="w-6 h-6 text-accent mb-2 relative z-10" />
            <h2 className="font-display text-base text-accent relative z-10">HIIT</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 relative z-10">Timer</p>
          </button>

          <button
            onClick={() => navigate("/intel")}
            className="group relative bg-card border-2 border-primary rounded p-4 text-left transition-all hover:box-glow-primary hover:border-primary"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded" />
            <Radio className="w-6 h-6 text-primary mb-2 relative z-10" />
            <h2 className="font-display text-base text-primary relative z-10">INTEL</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5 relative z-10">Stats & Feed</p>
          </button>

          {isHandler && (
            <button
              onClick={() => navigate("/handler")}
              className="group relative bg-card border-2 border-warning rounded p-4 text-left transition-all hover:border-warning"
              style={{ boxShadow: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 20px hsl(var(--warning) / 0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div className="absolute inset-0 bg-warning/5 group-hover:bg-warning/10 transition-colors rounded" />
              <Users className="w-6 h-6 text-warning mb-2 relative z-10" />
              <h2 className="font-display text-base text-warning relative z-10">HANDLER</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 relative z-10">Squads</p>
            </button>
          )}
        </motion.div>

        {/* Weekly Summary */}
        <WeeklySummary />

        {/* Incoming Orders */}
        {!isAnonymous && <IncomingOrders />}

        {/* Rival Mode Widget */}
        {!isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <RivalWidget />
          </motion.div>
        )}

        {/* Featured Missions */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-muted-foreground tracking-wider">// TODAY'S MISSIONS</h3>
          </div>

          <div className="space-y-3 mb-4">
            {featuredMissions.map((mission, i) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => navigate(`/mission/${mission.id}`)}
                className="w-full group bg-card border border-border rounded p-4 text-left hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg text-primary group-hover:text-glow-primary transition-all">
                        {mission.code_name}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-display ${
                          mission.estimated_minutes < 20
                            ? "bg-secondary/20 text-secondary"
                            : mission.estimated_minutes < 40
                              ? "bg-primary/20 text-primary"
                              : "bg-accent/20 text-accent"
                        }`}
                      >
                        {mission.estimated_minutes < 20 ? "QUICK" : mission.estimated_minutes < 40 ? "STD" : "LONG"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mission.focus_areas?.join(" • ")} • {mission.estimated_minutes}min
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-sm ${j < mission.difficulty ? "bg-accent" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Full Arsenal Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate("/command")}
            className="w-full group bg-card border-2 border-secondary/50 rounded-lg p-4 flex items-center justify-between hover:border-secondary hover:box-glow-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <Crosshair className="w-6 h-6 text-secondary" />
              <div className="text-left">
                <div className="font-display text-lg text-secondary group-hover:text-glow-secondary transition-all">
                  ACCESS COMMAND
                </div>
                <div className="text-xs text-muted-foreground">
                  {missions?.length || 0}+ missions • All campaigns • Your arsenal
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-4 text-xs">
            <button
              onClick={() => navigate("/guide")}
              className="text-muted-foreground hover:text-secondary transition-colors"
            >
              ? Guide
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => navigate("/donate")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              ♥ Support
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => navigate("/legal")}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>§</span> Legal
            </button>
          </div>
          <p className="text-xs text-muted-foreground/50 tracking-widest">v1.0 // NO MERCY</p>
        </motion.footer>

        {/* First Visit Popup */}
        <FirstVisitPopup />
      </div>
    </div>
  );
};

export default Dashboard;
