import { useState } from 'react';
import { Flame, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollections, useAddMissionToCollection, useRemoveMissionFromCollection } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { toast } from 'sonner';

// Lore phrases for adding missions
const ADD_LORE_PHRASES = [
  "MISSION ACQUIRED. CAMPAIGN UPGRADED.",
  "NEW OP INTEGRATED. GLORY AWAITS.",
  "TARGET LOCKED. DEPLOYMENT READY.",
  "INTEL RECEIVED. OPERATION EXPANDED.",
  "ASSET SECURED. VICTORY APPROACHES.",
];

// Lore phrases for removing missions
const REMOVE_LORE_PHRASES = [
  "MISSION SCRUBBED. PARAMETERS UPDATED.",
  "OP REMOVED. STRATEGY REFINED.",
  "TARGET RELEASED. FOCUS SHARPENED.",
  "INTEL PURGED. LEAN AND MEAN.",
];

interface AddToCollectionButtonProps {
  missionId: string;
  className?: string;
}

export function AddToCollectionButton({ missionId, className = '' }: AddToCollectionButtonProps) {
  const { user } = useAuth();
  const { data: collections } = useCollections();
  const addToCollection = useAddMissionToCollection();
  const removeFromCollection = useRemoveMissionFromCollection();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (!user) return null;

  const myCollections = collections?.filter(c => !c.is_system && c.created_by === user.id) || [];

  const isInCollection = (collectionId: string) => {
    const collection = collections?.find(c => c.id === collectionId);
    return collection?.collection_missions?.some(cm => cm.mission_id === missionId) || false;
  };

  const handleToggle = async (e: React.MouseEvent, collectionId: string, collectionName: string) => {
    e.stopPropagation();
    try {
      if (isInCollection(collectionId)) {
        await removeFromCollection.mutateAsync({ collectionId, missionId });
        const lore = REMOVE_LORE_PHRASES[Math.floor(Math.random() * REMOVE_LORE_PHRASES.length)];
        toast.success(lore, { description: `Removed from ${collectionName}` });
      } else {
        await addToCollection.mutateAsync({ collectionId, missionId });
        const lore = ADD_LORE_PHRASES[Math.floor(Math.random() * ADD_LORE_PHRASES.length)];
        toast.success(lore, { description: `Added to ${collectionName}` });
      }
    } catch (error: any) {
      toast.error('OPERATION FAILED', { 
        description: error.message || 'Failed to update campaign',
      });
    }
  };

  const handleNewCollectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Use setTimeout to ensure dropdown closes before dialog opens
    setTimeout(() => {
      setCreateDialogOpen(true);
    }, 0);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`p-1.5 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors ${className}`}
            title="Add to campaign"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-card border-border w-48"
          onClick={(e) => e.stopPropagation()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {myCollections.length === 0 ? (
            <div className="px-2 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">No campaigns yet</p>
            </div>
          ) : (
            myCollections.map(collection => (
              <DropdownMenuItem
                key={collection.id}
                onClick={(e) => handleToggle(e, collection.id, collection.code_name)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isInCollection(collection.id) 
                    ? 'bg-accent border-accent text-accent-foreground' 
                    : 'border-border'
                }`}>
                  {isInCollection(collection.id) && <Check className="w-3 h-3" />}
                </div>
                <span className="text-sm truncate">{collection.code_name}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleNewCollectionClick}
            className="flex items-center gap-2 text-accent cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Campaign</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {createDialogOpen && (
        <CollectionFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </>
  );
}