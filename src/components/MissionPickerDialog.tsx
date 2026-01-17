import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Zap, Plus, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMissions, MissionWithExercises } from '@/hooks/useMissions';

interface MissionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMission: (missionId: string) => void;
  existingMissionIds: string[];
}

export function MissionPickerDialog({
  open,
  onOpenChange,
  onAddMission,
  existingMissionIds,
}: MissionPickerDialogProps) {
  const [search, setSearch] = useState('');
  const { data: missions, isLoading } = useMissions({ showOnlyPublic: true });

  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    return missions.filter(m => {
      const matchesSearch = !search || 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code_name.toLowerCase().includes(search.toLowerCase()) ||
        m.focus_areas?.some(f => f.toLowerCase().includes(search.toLowerCase()));
      
      return matchesSearch;
    });
  }, [missions, search]);

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return { label: 'EASY', color: 'text-green-400' };
    if (difficulty <= 4) return { label: 'MEDIUM', color: 'text-yellow-400' };
    if (difficulty <= 6) return { label: 'HARD', color: 'text-orange-400' };
    return { label: 'EXTREME', color: 'text-red-400' };
  };

  const isAlreadyAdded = (missionId: string) => existingMissionIds.includes(missionId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            ADD MISSIONS
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search missions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              Loading missions...
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <X className="w-6 h-6 mx-auto mb-2" />
              No missions found
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMissions.map((mission, index) => {
                const difficulty = getDifficultyLabel(mission.difficulty);
                const added = isAlreadyAdded(mission.id);
                
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className={`group p-3 bg-background border rounded-lg transition-all cursor-pointer ${
                      added 
                        ? 'border-secondary/50 opacity-60' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => !added && onAddMission(mission.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm text-primary truncate">
                            {mission.code_name}
                          </h3>
                          <span className={`text-[10px] ${difficulty.color}`}>
                            {difficulty.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mission.estimated_minutes}m
                          </span>
                          {mission.focus_areas && mission.focus_areas.length > 0 && (
                            <span className="truncate">
                              {mission.focus_areas.slice(0, 2).join(' • ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {added ? (
                          <div className="w-8 h-8 rounded flex items-center justify-center bg-secondary/20 text-secondary">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            {existingMissionIds.length} missions in campaign
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
