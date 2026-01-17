import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Folder, FolderOpen, Pencil, Trash2, Lock, Globe, Users, Zap } from 'lucide-react';
import { useCollections, useDeleteCollection } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Collections = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: collections, isLoading } = useCollections();
  const deleteCollection = useDeleteCollection();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; name: string } | null>(null);

  const systemCollections = collections?.filter(c => c.is_system) || [];
  const myCollections = collections?.filter(c => !c.is_system && c.created_by === user?.id) || [];
  const publicCollections = collections?.filter(c => !c.is_system && c.visibility === 'public' && c.created_by !== user?.id) || [];

  const handleDeleteClick = (e: React.MouseEvent, collection: { id: string; name: string }) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (collectionToDelete) {
      await deleteCollection.mutateAsync(collectionToDelete.id);
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'shared': return <Users className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  const CollectionCard = ({ collection, isSystem = false, isOwner = false }: { 
    collection: typeof collections[0]; 
    isSystem?: boolean;
    isOwner?: boolean;
  }) => {
    const missionCount = collection.collection_missions?.length || 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
        onClick={() => navigate(`/missions?collection=${collection.id}`)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-secondary" />
              <h3 className="font-display text-lg text-primary">{collection.code_name}</h3>
            </div>
            
            <div className="flex items-center gap-1">
              {isSystem && (
                <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                  OFFICIAL
                </span>
              )}
              {!isSystem && (
                <span className="text-muted-foreground">{getVisibilityIcon(collection.visibility)}</span>
              )}
              {isOwner && !isSystem && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditCollection(collection.id); }}
                    className="p-1 hover:bg-secondary/20 rounded transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-secondary" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, { id: collection.id, name: collection.code_name })}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {collection.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{collection.description}</p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {missionCount} mission{missionCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-primary flex items-center gap-2">
                <Folder className="w-7 h-7" />
                COLLECTIONS
              </h1>
              <p className="text-xs text-muted-foreground tracking-wider">
                {isAnonymous ? (
                  <GuestIndicator variant="minimal" />
                ) : (
                  'Organize missions into themed groups'
                )}
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="p-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
              title="Create new collection"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </motion.header>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Official Collections */}
            {systemCollections.length > 0 && (
              <section>
                <h2 className="font-display text-sm text-secondary mb-3 tracking-wider">OFFICIAL COLLECTIONS</h2>
                <div className="grid gap-3">
                  {systemCollections.map(collection => (
                    <CollectionCard key={collection.id} collection={collection} isSystem />
                  ))}
                </div>
              </section>
            )}

            {/* My Collections */}
            {user && (
              <section>
                <h2 className="font-display text-sm text-secondary mb-3 tracking-wider">MY COLLECTIONS</h2>
                {myCollections.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <Folder className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-3">No collections yet</p>
                    <button
                      onClick={() => setCreateDialogOpen(true)}
                      className="text-xs text-secondary hover:text-glow-secondary font-display"
                    >
                      + CREATE YOUR FIRST COLLECTION
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {myCollections.map(collection => (
                      <CollectionCard key={collection.id} collection={collection} isOwner />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Public Collections */}
            {publicCollections.length > 0 && (
              <section>
                <h2 className="font-display text-sm text-secondary mb-3 tracking-wider">COMMUNITY COLLECTIONS</h2>
                <div className="grid gap-3">
                  {publicCollections.map(collection => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CollectionFormDialog
        open={createDialogOpen || !!editCollection}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditCollection(null);
          }
        }}
        collectionId={editCollection || undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">DELETE COLLECTION</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collectionToDelete?.name}"? This will not delete the missions inside.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Collections;
