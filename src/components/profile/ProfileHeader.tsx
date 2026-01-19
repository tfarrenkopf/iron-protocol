import { motion } from "framer-motion";
import { User, Edit2, Check, X, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { validateDisplayName } from "@/lib/displayNameValidation";

export function ProfileHeader() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Calculate level from XP
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const xpForNextLevel = level * level * 100;
  const xpProgress =
    ((xp - (level - 1) * (level - 1) * 100) / (xpForNextLevel - (level - 1) * (level - 1) * 100)) * 100;

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSave = async () => {
    if (displayName.trim()) {
      const validation = validateDisplayName(displayName.trim());
      if (!validation.isValid) {
        setError(validation.error || "Invalid display name");
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() || null });
      setIsEditing(false);
      setError(null);
    } catch {
      setError("Failed to update");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <div className="font-display text-xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6"
    >
      {/* Call Sign */}
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError(null);
                }}
                className="flex-1 bg-background border border-border rounded px-3 py-2 text-foreground font-display text-lg focus:outline-none focus:border-primary"
                placeholder="GHOST_REAPER"
                maxLength={15}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="p-2 bg-primary text-primary-foreground rounded hover:box-glow-primary transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(profile?.display_name || "");
                  setError(null);
                }}
                className="p-2 border border-border rounded hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <div className="font-display text-xl text-foreground">
                  {profile?.display_name || "AGENT"}
                </div>
                <div className="text-xs text-muted-foreground">CALL SIGN</div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Level & XP */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="font-display text-4xl text-foreground">{level}</div>
          <div className="text-xs text-muted-foreground">LEVEL</div>
        </div>
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-muted-foreground to-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, xpProgress)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </div>
        </div>
      </div>
    </motion.div>
  );
}
