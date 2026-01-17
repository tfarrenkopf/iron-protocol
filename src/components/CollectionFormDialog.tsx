import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Lock, Globe, Users, X, Plus, Crosshair, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCollection, useCreateCollection, useUpdateCollection, useAddMissionToCollection, useRemoveMissionFromCollection } from '@/hooks/useCollections';
import { MissionPickerDialog } from '@/components/MissionPickerDialog';
import { toast } from '@/hooks/use-toast';

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId?: string;
}

interface FormData {
  name: string;
  code_name: string;
  description: string;
  visibility: 'private' | 'public' | 'shared';
}

export function CollectionFormDialog({ open, onOpenChange, collectionId }: CollectionFormDialogProps) {
  const { data: existingCollection } = useCollection(collectionId);
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const addMission = useAddMissionToCollection();
  const removeMission = useRemoveMissionFromCollection();
  const isEditing = !!collectionId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [missionPickerOpen, setMissionPickerOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      code_name: '',
      description: '',
      visibility: 'private',
    },
  });

  const visibility = watch('visibility');
  const name = watch('name');

  // Get missions from the collection
  const missions = existingCollection?.collection_missions?.map(cm => cm.missions) || [];
  const missionIds = existingCollection?.collection_missions?.map(cm => cm.mission_id) || [];

  // Focus first input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Auto-generate code_name from name
  useEffect(() => {
    if (!isEditing && name) {
      const codeName = name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      setValue('code_name', codeName);
    }
  }, [name, isEditing, setValue]);

  // Load existing collection data
  useEffect(() => {
    if (existingCollection && isEditing) {
      reset({
        name: existingCollection.name,
        code_name: existingCollection.code_name,
        description: existingCollection.description || '',
        visibility: existingCollection.visibility as 'private' | 'public' | 'shared',
      });
    } else if (!isEditing) {
      reset({
        name: '',
        code_name: '',
        description: '',
        visibility: 'private',
      });
    }
  }, [existingCollection, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && collectionId) {
        await updateCollection.mutateAsync({
          id: collectionId,
          ...data,
        });
        toast({ title: 'Campaign updated', description: `${data.code_name} has been updated.` });
        onOpenChange(false);
      } else {
        const newCollection = await createCollection.mutateAsync(data);
        toast({ 
          title: 'Campaign created', 
          description: `${data.code_name} is ready. Now add missions to it!`,
        });
        onOpenChange(false);
        // Navigate to the new campaign to add missions
        if (newCollection?.id) {
          window.location.href = `/campaign/${newCollection.id}`;
        }
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save campaign',
        variant: 'destructive',
      });
    }
  };

  const handleAddMission = async (missionId: string) => {
    if (!collectionId) return;
    try {
      await addMission.mutateAsync({ collectionId, missionId });
      toast({ title: 'Mission added', description: 'Mission added to campaign' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRemoveMission = async (missionId: string) => {
    if (!collectionId) return;
    try {
      await removeMission.mutateAsync({ collectionId, missionId });
      toast({ title: 'Mission removed', description: 'Mission removed from campaign' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const visibilityOptions = [
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
    { value: 'public', label: 'Public', icon: Globe, description: 'Everyone' },
    { value: 'shared', label: 'Shared', icon: Users, description: 'Friends' },
  ] as const;

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop - clicking dismisses */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={handleClose}
            />
            
            {/* Full-screen overlay - matches Mission/Exercise creation */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 bg-background z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-h-full pb-safe">
                {/* Sticky header - matches Mission/Exercise pattern */}
                <div className="sticky top-0 z-10 bg-card border-b border-section-campaigns flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-section-campaigns" />
                    <h2 className="font-display text-xl text-section-campaigns">
                      {isEditing ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:text-destructive transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form content - centered like Mission/Exercise */}
                <div className="container mx-auto px-4 py-6 max-w-md">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="text-xs text-muted-foreground tracking-wider">CAMPAIGN NAME</Label>
                      <Input
                        id="name"
                        {...register('name', { required: 'Name is required' })}
                        ref={(e) => {
                          register('name').ref(e);
                          (inputRef as any).current = e;
                        }}
                        placeholder="e.g., MORNING ASSAULT"
                        className="bg-background border-border mt-1 font-display focus:border-section-campaigns"
                        autoComplete="off"
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Hidden code_name field - auto-generated from name */}
                    <input type="hidden" {...register('code_name')} />

                    <div>
                      <Label htmlFor="description" className="text-xs text-muted-foreground tracking-wider">DESCRIPTION</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="What's this campaign about?"
                        className="bg-background border-border mt-1 resize-none focus:border-section-campaigns"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground tracking-wider">VISIBILITY</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {visibilityOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue('visibility', option.value)}
                            className={`p-3 rounded border text-center transition-colors ${
                              visibility === option.value
                                ? 'bg-section-campaigns/10 border-section-campaigns text-section-campaigns'
                                : 'bg-background border-border hover:border-section-campaigns/50'
                            }`}
                          >
                            <option.icon className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-xs font-display block">{option.label}</span>
                            <span className="text-[10px] text-muted-foreground block">{option.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mission Management Section - only show when editing */}
                    {isEditing && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-xs text-muted-foreground tracking-wider flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-section-missions" />
                            MISSIONS ({missions.length})
                          </Label>
                          <button
                            type="button"
                            onClick={() => setMissionPickerOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-section-missions 
                                       border border-section-missions/50 rounded-lg
                                       hover:bg-section-missions/10 hover:border-section-missions
                                       transition-all font-display"
                          >
                            <Plus className="w-4 h-4" /> ADD
                          </button>
                        </div>

                        {/* Mission List */}
                        {missions.length === 0 ? (
                          <div className="bg-card border border-dashed border-section-missions/30 rounded-lg p-6 text-center">
                            <Crosshair className="w-8 h-8 mx-auto mb-2 text-section-missions/30" />
                            <p className="text-sm text-muted-foreground mb-3">No missions assigned yet</p>
                            <button
                              type="button"
                              onClick={() => setMissionPickerOpen(true)}
                              className="px-4 py-3 bg-section-missions text-white font-display text-sm rounded-lg
                                         hover:box-glow-missions transition-all flex items-center gap-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" /> ADD MISSIONS
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {missions.map((mission, index) => (
                              mission && (
                                <div 
                                  key={mission.id}
                                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs text-muted-foreground font-display w-5">
                                      #{index + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-display text-sm text-primary truncate">
                                        {mission.code_name}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{mission.estimated_minutes}m</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMission(mission.id)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 
                                               rounded transition-colors opacity-60 group-hover:opacity-100"
                                    aria-label="Remove mission"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            ))}
                            
                            {/* Add more button at bottom of list */}
                            <button
                              type="button"
                              onClick={() => setMissionPickerOpen(true)}
                              className="w-full py-3 border-2 border-dashed border-section-missions/40 rounded-lg
                                         text-section-missions hover:bg-section-missions/10 hover:border-section-missions
                                         transition-all flex items-center justify-center gap-2 font-display text-sm"
                            >
                              <Plus className="w-4 h-4" /> ADD MORE
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons - sticky at bottom on mobile */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-section-campaigns text-white hover:box-glow-campaigns"
                        disabled={createCollection.isPending || updateCollection.isPending}
                      >
                        {createCollection.isPending || updateCollection.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mission Picker Dialog */}
      {isEditing && (
        <MissionPickerDialog
          open={missionPickerOpen}
          onOpenChange={setMissionPickerOpen}
          onAddMission={handleAddMission}
          existingMissionIds={missionIds}
        />
      )}
    </>
  );
}