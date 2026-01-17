import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Timer, Trophy, User, LogOut, Plus, Swords, ChevronRight, Users, Crosshair, Folder } from "lucide-react";
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

  // Story 13.1: Select 3 random missions (1 short, 1 medium, 1 long)
  const featuredMissions = useMemo(() => {
    if (!missions || missions.length === 0) return [];

    // Categorize by duration
    const shortMissions = missions.filter((m) => m.estimated_minutes < 20);
    const mediumMissions = missions.filter((m) => m.estimated_minutes >= 20 && m.estimated_minutes < 40);
    const longMissions = missions.filter((m) => m.estimated_minutes >= 40);

    const selected: typeof missions = [];

    // Pick one from each category if available
    const short = getRandomItem(shortMissions);
    const medium = getRandomItem(mediumMissions);
    const long = getRandomItem(longMissions);

    if (short) selected.push(short);
    if (medium) selected.push(medium);
    if (long) selected.push(long);

    // If we don't have 3, fill with random missions we haven't picked
    const selectedIds = new Set(selected.map((m) => m.id));
    const remaining = missions.filter((m) => !selectedIds.has(m.id));

    while (selected.length < 3 && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(randomIndex, 1)[0]);
    }

    // Sort by duration for consistent display (short → medium → long)
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
        {/* Guest Mode Banner - Top Position */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-warning font-display">⚠️ GUEST MODE ACTIVE</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your progress won't be saved. Create an account to track your gains, create your own missions and
                exercises, and appear on the leaderboard.
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

            <button
              onClick={() => navigate("/exercises")}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              EDIT ARSENAL
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-6xl md:text-8xl text-primary text-glow-primary tracking-wider mb-2">
            IRON PROTOCOL
          </h1>
          <p className="font-body text-muted-foreground text-sm tracking-widest uppercase">
            Complete Missions • Defeat Enemies • Get Stronger
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2 max-w-md mx-auto">
            Choose a mission below to start your workout. Complete sets to earn XP and climb the ranks.
          </p>
        </motion.header>

        {/* Main Actions - Story 12.3: Core actions appear FIRST for quick access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`grid gap-4 mb-8 ${isHandler ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
        >
          <button
            onClick={() => navigate("/missions")}
            className="group relative bg-card border-2 border-primary rounded p-6 text-left transition-all hover:box-glow-primary hover:border-primary"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded" />
            <Dumbbell className="w-8 h-8 text-primary mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-primary relative z-10">MISSIONS</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Strength</p>
          </button>

          <button
            onClick={() => navigate("/hiit")}
            className="group relative bg-card border-2 border-secondary rounded p-6 text-left transition-all hover:box-glow-secondary hover:border-secondary"
          >
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors rounded" />
            <Timer className="w-8 h-8 text-secondary mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-secondary relative z-10">HIIT</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Timer</p>
          </button>

          <button
            onClick={() => navigate("/stats")}
            className="group relative bg-card border-2 border-accent rounded p-6 text-left transition-all hover:border-accent"
            style={{ boxShadow: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 20px hsl(20 100% 60% / 0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors rounded" />
            <Trophy className="w-8 h-8 text-accent mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-accent relative z-10">STATS</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Rankings</p>
          </button>

          {isHandler && (
            <button
              onClick={() => navigate("/handler")}
              className="group relative bg-card border-2 border-warning rounded p-6 text-left transition-all hover:border-warning"
              style={{ boxShadow: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 20px hsl(var(--warning) / 0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div className="absolute inset-0 bg-warning/5 group-hover:bg-warning/10 transition-colors rounded" />
              <Users className="w-8 h-8 text-warning mb-3 relative z-10" />
              <h2 className="font-display text-lg sm:text-xl text-warning relative z-10">HANDLER</h2>
              <p className="text-xs text-muted-foreground mt-1 relative z-10">Squads</p>
            </button>
          )}
        </motion.div>

        {/* Weekly Summary - Under action buttons (show for all users) */}
        <WeeklySummary />

        {/* Incoming Orders - Only show when logged in */}
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

        {/* Quick Links Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <button
            onClick={() => navigate("/front-lines")}
            className="p-4 bg-card border border-secondary/50 rounded flex items-center justify-between hover:border-secondary hover:box-glow-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-secondary" />
              <div className="text-left">
                <div className="font-display text-sm text-secondary">FRONT LINES</div>
                <div className="text-[10px] text-muted-foreground">Live feed</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-secondary" />
          </button>

          <button
            onClick={() => navigate("/collections")}
            className="p-4 bg-card border border-accent/50 rounded flex items-center justify-between hover:border-accent transition-all"
            style={{ boxShadow: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 15px hsl(20 100% 60% / 0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-accent" />
              <div className="text-left">
                <div className="font-display text-sm text-accent">COLLECTIONS</div>
                <div className="text-[10px] text-muted-foreground">Organize</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-accent" />
          </button>
        </motion.div>

        {/* Featured Missions - Story 13.1: Random selection by duration */}
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
                      {/* Duration badge */}
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

          {/* Story 13.2: Prominent Full Arsenal Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate("/missions")}
            className="w-full group bg-card border-2 border-primary/50 rounded-lg p-4 flex items-center justify-between hover:border-primary hover:box-glow-primary transition-all"
          >
            <div className="flex items-center gap-3">
              <Crosshair className="w-6 h-6 text-primary" />
              <div className="text-left">
                <div className="font-display text-lg text-primary group-hover:text-glow-primary transition-all">
                  FULL ARSENAL
                </div>
                <div className="text-xs text-muted-foreground">
                  {missions?.length || 0}+ missions available • All difficulties
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
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
