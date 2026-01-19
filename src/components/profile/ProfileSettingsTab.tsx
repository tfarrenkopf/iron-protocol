import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Save, 
  Shield, 
  Skull, 
  AlertTriangle, 
  X, 
  Check, 
  AlertCircle,
  ChevronRight,
  Bell,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useIsHandler, useToggleHandlerMode } from "@/hooks/useHandlerMode";
import { useWipeAllData } from "@/hooks/useWipeData";
import { useCompletedSessions } from "@/hooks/useWorkoutSessions";
import { validateDisplayName } from "@/lib/displayNameValidation";

export function ProfileSettingsTab() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: sessions } = useCompletedSessions();
  const { data: isHandler, isLoading: handlerLoading } = useIsHandler();
  const updateProfile = useUpdateProfile();
  const toggleHandler = useToggleHandlerMode();
  const wipeAllData = useWipeAllData();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState("");

  // Calculate level for display
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (displayName.trim()) {
      const validation = validateDisplayName(displayName.trim());
      if (!validation.isValid) {
        setError(validation.error || "Invalid display name");
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() || null });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to update profile");
    }
  };

  const handleWipeAllData = async () => {
    if (wipeConfirmText !== "SCORCHED EARTH") return;
    try {
      await wipeAllData.mutateAsync();
      setShowWipeConfirm(false);
      setWipeConfirmText("");
    } catch (err) {
      console.error("Failed to wipe data:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Call Sign */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-display text-muted-foreground">CALL SIGN</span>
        </div>
        
        <div className="space-y-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSuccess(false);
              setError(null);
            }}
            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground font-display focus:outline-none focus:border-primary"
            placeholder="GHOST_REAPER"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Public. 3-15 characters. Letters, numbers, underscores, dashes only.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-success">
              <Check className="w-3 h-3" />
              Saved successfully
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="w-full py-2 bg-primary text-primary-foreground font-display text-sm rounded hover:box-glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateProfile.isPending ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </form>

      {/* Handler Mode */}
      <div className="bg-card border border-secondary/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-secondary" />
            <div>
              <div className="text-sm font-display text-secondary">HANDLER MODE</div>
              <div className="text-xs text-muted-foreground">Create squads & assign missions</div>
            </div>
          </div>
          <button
            onClick={() => toggleHandler.mutateAsync(!isHandler)}
            disabled={toggleHandler.isPending || handlerLoading}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isHandler ? "bg-secondary" : "bg-muted"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isHandler ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        {isHandler && (
          <button
            onClick={() => navigate("/handler")}
            className="w-full mt-3 py-2 bg-secondary/10 border border-secondary/30 text-secondary font-display text-sm rounded flex items-center justify-center gap-2 hover:bg-secondary/20 transition-colors"
          >
            OPEN HANDLER OPS
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notification Preferences (Placeholder) */}
      <div className="bg-card border border-border rounded-lg p-4 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-display text-muted-foreground">NOTIFICATIONS</div>
              <div className="text-xs text-muted-foreground">Coming soon</div>
            </div>
          </div>
          <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
            DISABLED
          </div>
        </div>
      </div>

      {/* Privacy (View Only) */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Eye className="w-5 h-5 text-muted-foreground" />
          <div className="text-sm font-display text-muted-foreground">PRIVACY</div>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Rival Code</span>
            <span className="font-mono text-foreground">{profile?.rival_code || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Profile visibility</span>
            <span className="text-foreground">Call sign only</span>
          </div>
        </div>
      </div>

      {/* Scorched Earth */}
      <div className="bg-card border border-destructive/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Skull className="w-5 h-5 text-destructive" />
          <div className="text-sm font-display text-destructive">SCORCHED EARTH PROTOCOL</div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Permanently erase all mission history, exercises, and reset stats to zero. Call sign preserved.
        </p>
        <button
          onClick={() => setShowWipeConfirm(true)}
          className="w-full py-2 border-2 border-destructive text-destructive font-display text-sm rounded hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          INITIATE PROTOCOL
        </button>
      </div>

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {showWipeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-destructive rounded-lg p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Skull className="w-10 h-10 text-destructive animate-pulse" />
                </div>
                <h2 className="font-display text-2xl text-destructive mb-2">SCORCHED EARTH</h2>
                <p className="text-muted-foreground text-sm">This will permanently destroy:</p>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{sessions?.length || 0} mission records</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{(profile?.total_score || 0).toLocaleString()} total score</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{(profile?.total_xp || 0).toLocaleString()} XP (Level {level})</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground block mb-2">
                  Type SCORCHED EARTH to confirm:
                </label>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value.toUpperCase())}
                  className="w-full bg-background border border-destructive/50 rounded px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:border-destructive"
                  placeholder="SCORCHED EARTH"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowWipeConfirm(false);
                    setWipeConfirmText("");
                  }}
                  className="flex-1 py-3 border border-border rounded font-display hover:bg-muted transition-colors"
                >
                  ABORT
                </button>
                <button
                  onClick={handleWipeAllData}
                  disabled={wipeConfirmText !== "SCORCHED EARTH" || wipeAllData.isPending}
                  className="flex-1 py-3 bg-destructive text-destructive-foreground rounded font-display hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {wipeAllData.isPending ? "WIPING..." : "CONFIRM"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
