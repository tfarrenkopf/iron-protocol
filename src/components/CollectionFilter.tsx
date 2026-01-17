import { Folder, FolderOpen } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';

interface CollectionFilterProps {
  selectedCollectionId: string;
  onSelect: (collectionId: string) => void;
}

export function CollectionFilter({ selectedCollectionId, onSelect }: CollectionFilterProps) {
  const { user } = useAuth();
  const { data: collections, isLoading } = useCollections();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 w-24 bg-muted/20 rounded animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  // Separate system and user collections
  const systemCollections = collections?.filter(c => c.is_system) || [];
  const userCollections = collections?.filter(c => !c.is_system && c.created_by === user?.id) || [];
  const publicCollections = collections?.filter(c => !c.is_system && c.visibility === 'public' && c.created_by !== user?.id) || [];

  const allCollections = [...systemCollections, ...userCollections, ...publicCollections];

  if (allCollections.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="text-xs text-muted-foreground tracking-wider flex items-center gap-1 mb-2">
        <Folder className="w-3 h-3" /> COLLECTION
      </label>
      <div className="flex flex-wrap gap-2">
        {allCollections.map(collection => {
          const isSelected = selectedCollectionId === collection.id;
          const missionCount = collection.collection_missions?.length || 0;
          
          return (
            <button
              key={collection.id}
              onClick={() => onSelect(isSelected ? '' : collection.id)}
              className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'bg-background border-border hover:border-secondary/50'
              }`}
            >
              {isSelected ? (
                <FolderOpen className="w-3 h-3" />
              ) : (
                <Folder className="w-3 h-3" />
              )}
              <span>{collection.code_name}</span>
              {collection.is_system && (
                <span className="text-[10px] opacity-60">★</span>
              )}
              <span className="opacity-50">({missionCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
