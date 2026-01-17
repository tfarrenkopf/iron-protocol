import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Clock, Zap, ChevronDown, Dumbbell } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMissions } from '@/hooks/useMissions';
import { MissionCard } from '@/components/MissionCard';
import { FOCUS_AREAS, formatEquipment, EQUIPMENT_OPTIONS } from '@/data/muscleGroups';

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
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: missions, isLoading } = useMissions({ showOnlyPublic: true });

  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    return missions.filter(m => {
      // Search filter - include exercise names
      const exerciseNames = m.mission_exercises?.map(me => me.exercises?.name?.toLowerCase() || '').join(' ') || '';
      const matchesSearch = !search || 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code_name.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.focus_areas?.some(f => f.toLowerCase().includes(search.toLowerCase())) ||
        exerciseNames.includes(search.toLowerCase());
      
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
      
      // Equipment filter
      let matchesEquipment = true;
      if (equipmentFilter) {
        const missionEquipment = m.mission_exercises?.flatMap(me => me.exercises?.equipment || []) || [];
        matchesEquipment = missionEquipment.includes(equipmentFilter as any);
      }
      
      return matchesSearch && matchesFocus && matchesDuration && matchesEquipment;
    });
  }, [missions, search, focusFilter, durationFilter, equipmentFilter]);

  const isAlreadyAdded = (missionId: string) => existingMissionIds.includes(missionId);

  const activeFilterCount = [focusFilter, durationFilter, equipmentFilter].filter(Boolean).length;

  const handleClose = () => {
    setSearch('');
    setFocusFilter('');
    setDurationFilter('');
    setEquipmentFilter('');
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
            <div>
              <h2 className="font-display text-lg text-section-missions">ADD MISSIONS</h2>
              <p className="text-xs text-muted-foreground">
                {existingMissionIds.length} mission{existingMissionIds.length !== 1 ? 's' : ''} in campaign
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-3 -mr-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar - larger touch target */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search missions or exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-12 bg-card border-border h-14 text-base rounded-lg"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-muted rounded"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Quick filter chips - larger touch targets */}
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors flex-shrink-0 ${
                activeFilterCount > 0 
                  ? 'bg-section-missions/20 border-section-missions text-section-missions' 
                  : 'border-border hover:border-section-missions/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-display">FILTERS</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-section-missions text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Duration quick filters - larger touch targets */}
            {DURATION_FILTERS.slice(1).map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDurationFilter(durationFilter === filter.value ? '' : filter.value)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-lg border transition-colors flex-shrink-0 ${
                  durationFilter === filter.value
                    ? 'bg-secondary/20 border-secondary text-secondary'
                    : 'border-border hover:border-secondary/50'
                }`}
              >
                <Clock className="w-4 h-4" />
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
                <div className="p-4 space-y-4 bg-card/50">
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
                  
                  <div>
                    <label className="text-xs text-muted-foreground font-display tracking-wider mb-2 block">
                      EQUIPMENT
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {EQUIPMENT_OPTIONS.map((equip) => (
                        <button
                          key={equip}
                          onClick={() => setEquipmentFilter(equipmentFilter === equip ? '' : equip)}
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            equipmentFilter === equip
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {formatEquipment(equip)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {(focusFilter || durationFilter || equipmentFilter) && (
                    <button
                      onClick={() => { setFocusFilter(''); setDurationFilter(''); setEquipmentFilter(''); }}
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

        {/* Mission List - increased spacing for touch */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Zap className="w-8 h-8 mx-auto mb-3 text-section-missions animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading missions...</p>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-12">
              <X className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">No missions found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {filteredMissions.length} mission{filteredMissions.length !== 1 ? 's' : ''} available
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
