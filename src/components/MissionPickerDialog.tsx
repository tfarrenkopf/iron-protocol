import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Clock, Zap, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMissions } from '@/hooks/useMissions';
import { MissionCard } from '@/components/MissionCard';
import { FOCUS_AREAS } from '@/data/muscleGroups';

const DURATION_FILTERS = [
  { label: 'All', value: '' },
  { label: '< 20m', value: 'short', max: 20 },
  { label: '20-40m', value: 'medium', min: 20, max: 40 },
  { label: '> 40m', value: 'long', min: 40 },
];

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
  const [focusFilter, setFocusFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: missions, isLoading } = useMissions({ showOnlyPublic: true });

  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    return missions.filter(m => {
      // Search filter
      const matchesSearch = !search || 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code_name.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.focus_areas?.some(f => f.toLowerCase().includes(search.toLowerCase()));
      
      // Focus area filter
      const matchesFocus = !focusFilter || m.focus_areas?.includes(focusFilter);
      
      // Duration filter
      let matchesDuration = true;
      if (durationFilter) {
        const filter = DURATION_FILTERS.find(f => f.value === durationFilter);
        if (filter) {
          if (filter.max && m.estimated_minutes >= filter.max) matchesDuration = false;
          if (filter.min && m.estimated_minutes < filter.min) matchesDuration = false;
        }
      }
      
      return matchesSearch && matchesFocus && matchesDuration;
    });
  }, [missions, search, focusFilter, durationFilter]);

  const isAlreadyAdded = (missionId: string) => existingMissionIds.includes(missionId);

  const activeFilterCount = [focusFilter, durationFilter].filter(Boolean).length;

  const handleClose = () => {
    setSearch('');
    setFocusFilter('');
    setDurationFilter('');
    setShowFilters(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-full h-[100dvh] sm:max-w-lg sm:h-[85vh] p-0 gap-0 bg-background border-none sm:border sm:border-border sm:rounded-lg overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border">
          {/* Title bar */}
          <div className="flex items-center justify-between p-4 pb-3">
            <h2 className="font-display text-lg text-primary">ADD MISSIONS</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search missions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 bg-card border-border h-12 text-base"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                activeFilterCount > 0 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-display">FILTERS</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Duration quick filters */}
            {DURATION_FILTERS.slice(1).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDurationFilter(durationFilter === filter.value ? '' : filter.value)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                  durationFilter === filter.value
                    ? 'bg-secondary/20 border-secondary text-secondary'
                    : 'border-border hover:border-secondary/50'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span className="text-sm">{filter.label}</span>
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="p-4 space-y-3 bg-card/50">
                  <div>
                    <label className="text-xs text-muted-foreground font-display tracking-wider mb-2 block">
                      FOCUS AREA
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FOCUS_AREAS.map((area) => (
                        <button
                          key={area}
                          onClick={() => setFocusFilter(focusFilter === area ? '' : area)}
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            focusFilter === area
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {(focusFilter || durationFilter) && (
                    <button
                      onClick={() => { setFocusFilter(''); setDurationFilter(''); }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <Zap className="w-8 h-8 mx-auto mb-3 text-primary animate-pulse" />
              <p className="text-muted-foreground">Loading missions...</p>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-12">
              <X className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No missions found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                {filteredMissions.length} mission{filteredMissions.length !== 1 ? 's' : ''} found
                {existingMissionIds.length > 0 && ` • ${existingMissionIds.length} in campaign`}
              </p>
              {filteredMissions.map((mission, index) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  index={index}
                  variant="picker"
                  isAdded={isAlreadyAdded(mission.id)}
                  onAdd={() => onAddMission(mission.id)}
                />
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
